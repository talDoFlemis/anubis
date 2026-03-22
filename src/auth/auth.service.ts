import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  Scope,
  UnprocessableEntityException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { Request } from 'express';
import type { Session, SessionData } from 'express-session';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { AuthProvidersEnum } from './auth-providers.enum';
import { SocialInterface } from '../social/interfaces/social.interface';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { User } from '../users/domain/user';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { CandidateService } from '../candidate/candidate.service';
import { CompleteCandidateOnboardingDto } from '../candidate/dto/complete-candidate-onboarding.dto';
import { buildLoginResponse } from './login-response.builder';
import { getPreferredLoginProvider } from './auth-provider.utils';
import { MailService } from '../mail/mail.service';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly candidateService: CandidateService,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    @Optional()
    @Inject(REQUEST)
    private readonly request?: Request,
  ) {}

  async validateSocialLogin(
    authProvider: AuthProvidersEnum,
    socialData: SocialInterface,
  ): Promise<{ user: User; loginResponse: LoginResponseDto }> {
    this.logger.debug(
      { provider: authProvider, socialId: socialData.id },
      'Social login attempt',
    );

    try {
      if (!socialData.id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'Dados do provedor social invalidos.',
        });
      }

      const existingByProvider = await this.usersService.findByProviderAccount({
        socialId: socialData.id,
        provider: authProvider,
      });

      if (existingByProvider) {
        this.persistSnapshotAfterSessionRegeneration(existingByProvider);
        this.logger.info(
          { userId: existingByProvider.id, provider: authProvider },
          'Social login authenticated existing linked account',
        );
        return {
          user: existingByProvider,
          loginResponse: buildLoginResponse(existingByProvider),
        };
      }

      const socialEmail = socialData.email?.toLowerCase();
      const userByOwnedVerifiedEmail = socialEmail
        ? await this.usersService.findUserByOwnedVerifiedEmail(socialEmail)
        : null;

      if (userByOwnedVerifiedEmail) {
        const loginProvider = getPreferredLoginProvider(
          userByOwnedVerifiedEmail.linkedProviders,
        );
        throw new ConflictException({
          message: `Este e-mail ja possui conta existente. Entre com ${loginProvider ?? 'o provedor ja vinculado'} e vincule ${authProvider} explicitamente.`,
        });
      }

      const createdUser = await this.usersService.create({
        email: socialEmail ?? null,
        firstName: socialData.firstName ?? null,
        lastName: socialData.lastName ?? null,
        role: RoleEnum.candidate,
        status: StatusEnum.active,
        onboardingCompleted: false,
        mustChangePassword: false,
      });

      await this.usersService.linkProviderAccount({
        userId: createdUser.id,
        provider: authProvider,
        socialId: socialData.id,
      });

      const user = await this.usersService.findById(createdUser.id);

      if (!user) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message:
            'Nao foi possivel autenticar com os dados sociais fornecidos.',
        });
      }

      this.logger.info(
        { userId: user.id, provider: authProvider },
        'Social login created new linked account',
      );

      this.persistSnapshotAfterSessionRegeneration(user);

      return {
        user,
        loginResponse: buildLoginResponse(user),
      };
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          provider: authProvider,
          socialId: socialData.id,
        },
        'Social login failed',
      );
      throw error;
    }
  }

  async completeCandidateOnboarding(
    userId: string,
    dto: CompleteCandidateOnboardingDto,
  ): Promise<User> {
    this.logger.debug({ userId }, 'Candidate onboarding flow requested');

    try {
      const previousUser = await this.usersService.findById(userId);

      await this.candidateService.completeOnboarding(userId, dto);

      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new NotFoundException({
          message: 'Usuario nao encontrado.',
        });
      }

      if (previousUser) {
        const sessionChange = this.sessionService.resolveSnapshotChange({
          previousUser,
          nextUser: user,
        });

        if (sessionChange.revokeAllSessions) {
          await this.sessionService.deleteByUserId(user.id);
        }

        if (sessionChange.refreshCurrentSession) {
          this.persistCurrentSessionSnapshot(user);
        }
      }

      this.logger.info({ userId }, 'Candidate onboarding flow completed');
      return user;
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
        },
        'Candidate onboarding flow failed',
      );
      throw error;
    }
  }

  async linkGoogleProvider(
    userId: string,
    socialData: SocialInterface,
  ): Promise<User> {
    this.logger.debug(
      { userId, socialId: socialData.id },
      'Google link requested',
    );

    if (!socialData.id) {
      this.logger.error(
        { userId },
        'Google link failed due to invalid provider data',
      );
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Dados do provedor social invalidos.',
      });
    }

    const updated = await this.linkProviderAccount(
      userId,
      AuthProvidersEnum.google,
      socialData,
    );
    this.logger.info({ userId }, 'Google provider linked');
    return updated;
  }

  async me(userId: string): Promise<User | null> {
    this.logger.debug({ userId }, 'Fetching current user');
    return this.usersService.findById(userId);
  }

  async update(
    userId: string,
    sessionId: string,
    userDto: AuthUpdateDto,
  ): Promise<User | null> {
    this.logger.debug({ userId }, 'User update requested');

    try {
      const currentUser = await this.usersService.findById(userId);

      if (!currentUser) {
        throw new NotFoundException({
          message: 'Usuario nao encontrado.',
        });
      }

      if (currentUser.mustChangePassword) {
        const onlyPasswordChange =
          userDto.password !== undefined &&
          userDto.oldPassword !== undefined &&
          userDto.firstName === undefined &&
          userDto.lastName === undefined &&
          userDto.email === undefined &&
          userDto.cpf === undefined;

        if (!onlyPasswordChange) {
          throw new BadRequestException({
            message:
              'Usuario com troca obrigatoria de senha so pode alterar senha antes de acessar outras operacoes.',
          });
        }
      }

      const passwordUpdate = await this.preparePasswordUpdate(
        userDto,
        currentUser,
      );

      if (userDto.email && userDto.email !== currentUser.email) {
        const userByEmail = await this.usersService.findByEmail(userDto.email);

        if (userByEmail && userByEmail.id !== currentUser.id) {
          throw new ConflictException({
            message: 'Este e-mail ja esta em uso por outra conta.',
          });
        }

        const nextConfirmEmailTokenVersion =
          currentUser.confirmEmailTokenVersion + 1;
        await this.usersService.update(currentUser.id, {
          confirmEmailTokenVersion: nextConfirmEmailTokenVersion,
        });

        const hash = await this.jwtService.signAsync(
          {
            confirmEmailUserId: currentUser.id,
            newEmail: userDto.email,
            confirmEmailTokenVersion: nextConfirmEmailTokenVersion,
          },
          {
            secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
            expiresIn: this.configService.getOrThrow(
              'AUTH_CONFIRM_EMAIL_EXPIRES_IN',
            ),
          },
        );

        await this.mailService.send({
          to: userDto.email,
          title: 'Confirme seu novo email - Anubis',
          body: this.composeConfirmNewEmailBody(hash),
        });
      }

      if (userDto.cpf && userDto.cpf !== currentUser.cpf) {
        const existingCpf = await this.usersService.findByCpf(userDto.cpf);
        if (existingCpf && existingCpf.id !== currentUser.id) {
          throw new ConflictException({
            message: 'Este CPF ja esta em uso por outra conta.',
          });
        }
      }

      const updatePayload: Record<string, unknown> = {};
      if (userDto.firstName !== undefined)
        updatePayload.firstName = userDto.firstName;
      if (userDto.lastName !== undefined)
        updatePayload.lastName = userDto.lastName;
      if (userDto.cpf !== undefined) updatePayload.cpf = userDto.cpf;
      if (passwordUpdate) {
        updatePayload.password = passwordUpdate.hashedPassword;
        updatePayload.mustChangePassword = false;
        updatePayload.bootstrapPasswordExpiresAt = null;
      }

      if (Object.keys(updatePayload).length > 0) {
        await this.usersService.update(userId, updatePayload);
      }

      const updatedUser = await this.usersService.findById(userId);
      if (updatedUser) {
        const sessionChange = this.sessionService.resolveSnapshotChange({
          previousUser: currentUser,
          nextUser: updatedUser,
          passwordChanged: Boolean(passwordUpdate),
        });

        if (sessionChange.revokeAllSessions) {
          await this.sessionService.deleteByUserId(updatedUser.id);
        } else if (sessionChange.revokeOtherSessions) {
          await this.sessionService.deleteByUserIdWithExclude({
            userId: currentUser.id,
            excludeSessionId: sessionId,
          });
        }

        if (sessionChange.refreshCurrentSession) {
          this.persistCurrentSessionSnapshot(updatedUser);
        }
      }
      this.logger.info({ userId }, 'User updated');
      return updatedUser;
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
        },
        'User update failed',
      );
      throw error;
    }
  }

  async softDelete(userId: string): Promise<void> {
    this.logger.debug({ userId }, 'User soft delete requested');

    try {
      await this.sessionService.deleteByUserId(userId);
      await this.usersService.remove(userId);
      this.logger.info({ userId }, 'User soft deleted');
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
        },
        'User soft delete failed',
      );
      throw error;
    }
  }

  private async linkProviderAccount(
    userId: string,
    provider: AuthProvidersEnum,
    socialData: SocialInterface,
  ): Promise<User> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException({
        message: 'Usuario nao encontrado.',
      });
    }

    const hasProvider = await this.usersService.hasProviderAccount({
      userId: user.id,
      provider,
    });

    if (hasProvider) {
      throw new ConflictException({
        message: `Conta ${provider} ja vinculada.`,
      });
    }

    const existingProviderUser = await this.usersService.findByProviderAccount({
      provider,
      socialId: socialData.id,
    });

    if (existingProviderUser && existingProviderUser.id !== user.id) {
      throw new ConflictException({
        message: `Esta conta ${provider} ja esta vinculada a outro usuario.`,
      });
    }

    const socialEmail = socialData.email?.toLowerCase();
    if (socialEmail) {
      const userByOwnedVerifiedEmail =
        await this.usersService.findUserByOwnedVerifiedEmail(socialEmail);

      if (userByOwnedVerifiedEmail && userByOwnedVerifiedEmail.id !== user.id) {
        throw new ConflictException({
          message: `Este e-mail do provedor ${provider} ja pertence a outro usuario.`,
        });
      }

      if (
        !userByOwnedVerifiedEmail ||
        userByOwnedVerifiedEmail.id !== user.id
      ) {
        throw new BadRequestException({
          message:
            'O e-mail do provedor nao corresponde ao e-mail da sessao autenticada.',
        });
      }
    }

    await this.usersService.linkProviderAccount({
      userId: user.id,
      provider,
      socialId: socialData.id,
    });

    const updated = await this.usersService.findById(user.id);

    if (!updated) {
      throw new NotFoundException({
        message: 'Usuario nao encontrado.',
      });
    }

    return updated;
  }

  private async preparePasswordUpdate(
    userDto: AuthUpdateDto,
    currentUser: User,
  ): Promise<{ hashedPassword: string } | null> {
    if (!userDto.password) return null;

    if (!userDto.oldPassword) {
      throw new BadRequestException({
        message: 'E necessario informar a senha atual para altera-la.',
      });
    }

    if (!currentUser.password) {
      throw new BadRequestException({
        message: 'Senha atual incorreta.',
      });
    }

    const isValidOldPassword = await bcrypt.compare(
      userDto.oldPassword,
      currentUser.password,
    );

    if (!isValidOldPassword) {
      throw new BadRequestException({
        message: 'Senha atual incorreta.',
      });
    }

    return {
      hashedPassword: await bcrypt.hash(userDto.password, BCRYPT_SALT_ROUNDS),
    };
  }

  private composeConfirmNewEmailBody(hash: string): string {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const confirmUrl = `${frontendUrl}/auth/confirm-new-email?hash=${hash}`;

    return `<p>Voce solicitou alteracao do seu e-mail. Clique no link abaixo para confirmar:</p><p><a href="${confirmUrl}">Confirmar novo e-mail</a></p>`;
  }

  private persistCurrentSessionSnapshot(
    user: Pick<
      User,
      'id' | 'role' | 'status' | 'onboardingCompleted' | 'mustChangePassword'
    >,
  ): void {
    const session = this.getCurrentSession();

    if (!session) {
      return;
    }

    this.assignSessionSnapshot(session, user);
  }

  private persistSnapshotAfterSessionRegeneration(
    user: Pick<
      User,
      'id' | 'role' | 'status' | 'onboardingCompleted' | 'mustChangePassword'
    >,
  ): void {
    const session = this.getCurrentSession();

    if (!session) {
      return;
    }

    const originalRegenerate = session.regenerate.bind(session);
    session.regenerate = ((callback) => {
      originalRegenerate((err) => {
        if (!err) {
          const refreshedSession = this.getCurrentSession();
          if (refreshedSession) {
            this.assignSessionSnapshot(refreshedSession, user);
          }
        }

        callback?.(err);
      });
    }) as typeof session.regenerate;
  }

  private getCurrentSession(): (Session & Partial<SessionData>) | null {
    return this.request?.session ?? null;
  }

  private assignSessionSnapshot(
    session: Session & Partial<SessionData>,
    user: Pick<
      User,
      'id' | 'role' | 'status' | 'onboardingCompleted' | 'mustChangePassword'
    >,
  ): void {
    session.userId = user.id;
    session.userRole = user.role;
    session.role = user.role;
    session.status = user.status;
    session.onboardingCompleted = user.onboardingCompleted;
    session.mustChangePassword = user.mustChangePassword;
  }
}
