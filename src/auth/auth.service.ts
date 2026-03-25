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
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { AuthProvidersEnum } from './auth-providers.enum';
import { SocialInterface } from '../social/interfaces/social.interface';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { User } from '../users/domain/user';
import { LoginResponseDto } from '../auth-email/dto/login-response.dto';
import { AuthUpdateDto } from '../auth-email/dto/auth-update.dto';
import { CandidateService } from '../candidate/candidate.service';
import { CompleteCandidateOnboardingDto } from '../candidate/dto/complete-candidate-onboarding.dto';
import { buildLoginResponse } from './login-response.builder';
import { MailService } from '../mail/mail.service';

const BCRYPT_SALT_ROUNDS = 12;

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
  ) {}

  async validateSocialLogin(
    authProvider: AuthProvidersEnum,
    socialData: SocialInterface,
  ): Promise<{ user: User; loginResponse: LoginResponseDto }> {
    this.logger.debug(
      { provider: authProvider, subject: socialData.id },
      'Social login attempt',
    );

    if (!socialData.id || !socialData.email || !socialData.verified_email) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Dados do provedor social invalidos.',
      });
    }

    const normalizedEmail = socialData.email.toLowerCase().trim();
    const existingByProvider = await this.usersService.findByAuthProvider({
      provider: authProvider,
      providerSubject: socialData.id,
    });

    if (existingByProvider) {
      return {
        user: existingByProvider,
        loginResponse: buildLoginResponse(existingByProvider),
      };
    }

    const existingByEmail =
      await this.usersService.findByEmail(normalizedEmail);
    if (existingByEmail) {
      throw new ConflictException({
        message: `Este e-mail ja pertence a uma conta criada com ${existingByEmail.authProvider}. Use seu provedor original.`,
      });
    }

    const createdUser = await this.usersService.create({
      email: normalizedEmail,
      password: null,
      firstName: socialData.firstName ?? null,
      lastName: socialData.lastName ?? null,
      role: RoleEnum.candidate,
      status: StatusEnum.active,
      authProvider,
      providerSubject: socialData.id,
      onboardingCompleted: false,
      mustChangePassword: false,
    });

    const user = await this.usersService.findById(createdUser.id);
    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Nao foi possivel autenticar com os dados sociais fornecidos.',
      });
    }

    return {
      user,
      loginResponse: buildLoginResponse(user),
    };
  }

  async completeCandidateOnboarding(
    userId: string,
    dto: CompleteCandidateOnboardingDto,
  ): Promise<User> {
    const previousUser = await this.usersService.findById(userId);
    await this.candidateService.completeOnboarding(userId, dto);

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException({ message: 'Usuario nao encontrado.' });
    }

    if (previousUser) {
      const sessionChange = this.sessionService.resolveSnapshotChange({
        previousUser,
        nextUser: user,
      });

      if (sessionChange.revokeAllSessions) {
        await this.sessionService.deleteByUserId(user.id);
      }
    }

    return user;
  }

  async me(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  async update(
    userId: string,
    sessionId: string,
    userDto: AuthUpdateDto,
  ): Promise<User | null> {
    const currentUser = await this.usersService.findById(userId);
    if (!currentUser) {
      throw new NotFoundException({ message: 'Usuario nao encontrado.' });
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
      const normalizedEmail = userDto.email.toLowerCase().trim();
      const userByEmail = await this.usersService.findByEmail(normalizedEmail);

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
          newEmail: normalizedEmail,
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
        to: normalizedEmail,
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
    }

    return updatedUser;
  }

  async softDelete(userId: string): Promise<void> {
    await this.sessionService.deleteByUserId(userId);
    await this.usersService.remove(userId);
  }

  private async preparePasswordUpdate(
    userDto: AuthUpdateDto,
    currentUser: User,
  ): Promise<{ hashedPassword: string } | null> {
    if (!userDto.password) return null;

    if (currentUser.authProvider !== AuthProvidersEnum.email) {
      throw new BadRequestException({
        message:
          'Conta cadastrada com outro provedor. Use seu provedor original.',
      });
    }

    if (!userDto.oldPassword) {
      throw new BadRequestException({
        message: 'E necessario informar a senha atual para altera-la.',
      });
    }

    if (!currentUser.password) {
      throw new BadRequestException({ message: 'Senha atual incorreta.' });
    }

    const isValidOldPassword = await bcrypt.compare(
      userDto.oldPassword,
      currentUser.password,
    );

    if (!isValidOldPassword) {
      throw new BadRequestException({ message: 'Senha atual incorreta.' });
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
}
