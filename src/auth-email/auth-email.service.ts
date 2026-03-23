import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CandidateService } from '../candidate/candidate.service';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { getFirstNonEmailProvider } from '../auth/auth-provider.utils';
import { AuthConfirmEmailDto } from '../auth/dto/auth-confirm-email.dto';
import { AuthEmailLoginDto } from '../auth/dto/auth-email-login.dto';
import { AuthForgotPasswordDto } from '../auth/dto/auth-forgot-password.dto';
import { AuthLinkEmailProviderDto } from '../auth/dto/auth-link-email-provider.dto';
import { AuthRegisterDto } from '../auth/dto/auth-register.dto';
import { AuthResetPasswordDto } from '../auth/dto/auth-reset-password.dto';
import { LoginResponseDto } from '../auth/dto/login-response.dto';
import { buildLoginResponse } from '../auth/login-response.builder';
import { AuthGoogleService } from '../auth-google/auth-google.service';
import { MailService } from '../mail/mail.service';
import { SessionService } from '../session/session.service';
import { StatusEnum } from '../statuses/statuses.enum';
import { User } from '../users/domain/user';
import { UsersService } from '../users/users.service';
import { RoleEnum } from '../roles/roles.enum';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthEmailService {
  constructor(
    private readonly usersService: UsersService,
    private readonly candidateService: CandidateService,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authGoogleService: AuthGoogleService,
    @InjectPinoLogger(AuthEmailService.name)
    private readonly logger: PinoLogger,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<{
    user: User;
    loginResponse: LoginResponseDto;
  }> {
    this.logger.debug({ email: loginDto.email }, 'Email login attempt');

    try {
      const user = await this.findUserByOwnedVerifiedEmail(loginDto.email);

      if (!user) {
        throw new UnauthorizedException('E-mail ou senha invalidos.');
      }

      const hasEmailProvider = user.linkedProviders.includes(
        AuthProvidersEnum.email,
      );

      if (!hasEmailProvider) {
        const provider = getFirstNonEmailProvider(user.linkedProviders);
        throw new BadRequestException(
          `Esta conta utiliza login via ${provider ?? 'outro provedor'}. Entre com esse metodo e vincule e-mail/senha explicitamente.`,
        );
      }

      const isValidPassword = await bcrypt.compare(
        loginDto.password,
        user.password ?? '',
      );

      if (!isValidPassword) {
        throw new UnauthorizedException('E-mail ou senha invalidos.');
      }

      if (user.mustChangePassword) {
        this.logger.debug(
          { userId: user.id },
          'User login requires mandatory password change',
        );

        if (
          user.bootstrapPasswordExpiresAt &&
          user.bootstrapPasswordExpiresAt.getTime() < Date.now()
        ) {
          throw new UnauthorizedException(
            'Senha temporaria expirada. Solicite redefinicao de senha para concluir acesso.',
          );
        }
      }

      if (user.status !== StatusEnum.active) {
        throw new UnauthorizedException(
          'Usuario inativo. Verifique seu e-mail para ativar sua conta ou entre em contato com um administrador.',
        );
      }

      this.logger.info({ userId: user.id }, 'Email login successful');

      return {
        user,
        loginResponse: buildLoginResponse(user),
      };
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          email: loginDto.email,
        },
        'Email login failed',
      );
      throw error;
    }
  }

  async register(dto: AuthRegisterDto): Promise<void> {
    this.logger.debug(
      { email: dto.email },
      'Candidate e-mail registration requested',
    );

    try {
      const existingUser = await this.usersService.findByEmail(dto.email);
      if (existingUser) {
        const hasEmail = existingUser.linkedProviders.includes(
          AuthProvidersEnum.email,
        );

        if (!hasEmail) {
          const provider = getFirstNonEmailProvider(
            existingUser.linkedProviders,
          );
          throw new ConflictException(
            `Este e-mail ja esta cadastrado via ${provider ?? 'outro provedor'}. Entre com esse provedor, conclua onboarding e vincule e-mail/senha explicitamente.`,
          );
        }

        throw new ConflictException('Este e-mail ja esta cadastrado.');
      }

      const existingCpf = await this.usersService.findByCpf(dto.cpf);
      if (existingCpf) {
        throw new ConflictException('Este CPF ja esta cadastrado.');
      }

      const hashedPassword = await bcrypt.hash(
        dto.password,
        BCRYPT_SALT_ROUNDS,
      );

      const user = await this.usersService.create({
        email: dto.email,
        password: hashedPassword,
        cpf: dto.cpf,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: RoleEnum.candidate,
        status: StatusEnum.inactive,
        onboardingCompleted: true,
        mustChangePassword: false,
        confirmEmailTokenVersion: 0,
        forgotPasswordTokenVersion: 0,
      });

      await this.usersService.linkProviderAccount({
        userId: user.id,
        provider: AuthProvidersEnum.email,
        socialId: null,
      });

      await this.candidateService.createProfile({
        userId: user.id,
        universityOfOrigin: dto.universityOfOrigin,
      });

      const nextConfirmEmailTokenVersion = user.confirmEmailTokenVersion + 1;
      await this.usersService.update(user.id, {
        confirmEmailTokenVersion: nextConfirmEmailTokenVersion,
      });

      const hash = await this.jwtService.signAsync(
        {
          confirmEmailUserId: user.id,
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
        to: dto.email,
        title: 'Confirme seu email - Anubis',
        body: this.composeConfirmEmailBody(hash),
      });

      this.logger.info(
        { userId: user.id },
        'Candidate e-mail registration created',
      );
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          email: dto.email,
        },
        'Candidate e-mail registration failed',
      );
      throw error;
    }
  }

  async confirmEmail(dto: AuthConfirmEmailDto): Promise<void> {
    this.logger.debug('Confirm e-mail requested');

    try {
      const token = await this.verifyConfirmToken(dto.hash);
      const user = await this.usersService.findById(token.confirmEmailUserId);

      if (!user) {
        throw new NotFoundException('Usuario nao encontrado.');
      }

      if (user.status === StatusEnum.active) {
        return;
      }

      if (user.confirmEmailTokenVersion !== token.confirmEmailTokenVersion) {
        this.logger.error(
          {
            tokenVersion: token.confirmEmailTokenVersion,
            userVersion: user.confirmEmailTokenVersion,
          },
          'Confirm e-mail token version mismatch',
        );
        throw new BadRequestException(
          'Link de confirmacao invalido ou expirado.',
        );
      }

      await this.usersService.update(user.id, {
        status: StatusEnum.active,
        confirmEmailTokenVersion: token.confirmEmailTokenVersion + 1,
      });

      this.logger.info({ userId: user.id }, 'E-mail confirmed');
    } catch (error: unknown) {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Confirm e-mail failed',
      );
      throw error;
    }
  }

  async confirmNewEmail(dto: AuthConfirmEmailDto): Promise<void> {
    this.logger.debug('Confirm new e-mail requested');

    try {
      const token = await this.verifyConfirmNewEmailToken(dto.hash);
      const user = await this.usersService.findById(token.confirmEmailUserId);

      if (!user) {
        throw new NotFoundException({
          message: 'Usuario nao encontrado.',
        });
      }

      if (user.confirmEmailTokenVersion !== token.confirmEmailTokenVersion) {
        throw new BadRequestException({
          message: 'Link de confirmacao invalido ou expirado.',
        });
      }

      const normalizedNewEmail = token.newEmail.toLowerCase();
      const emailOwner = await this.findUserByOwnedVerifiedEmail(
        token.newEmail,
      );
      if (emailOwner && emailOwner.id !== user.id) {
        throw new ConflictException({
          message: 'Este e-mail ja esta em uso por outra conta.',
        });
      }

      const ownedEmails = await this.listUserOwnedEmails(user);
      const existingOwnedEmail = ownedEmails.find(
        (ownedEmail) => ownedEmail.normalizedEmail === normalizedNewEmail,
      );

      if (!existingOwnedEmail) {
        const attachedEmail = await this.attachVerifiedOwnedEmail({
          userId: user.id,
          email: token.newEmail,
          normalizedEmail: normalizedNewEmail,
        });

        await this.promoteOwnedEmailToPrimary({
          userId: user.id,
          accountId: attachedEmail.accountId,
          email: token.newEmail,
        });
      } else if (!existingOwnedEmail.isPrimary) {
        await this.promoteOwnedEmailToPrimary({
          userId: user.id,
          accountId: existingOwnedEmail.accountId,
          email: token.newEmail,
        });
      }

      await this.usersService.update(user.id, {
        status: StatusEnum.active,
        confirmEmailTokenVersion: token.confirmEmailTokenVersion + 1,
      });

      this.logger.info({ userId: user.id }, 'New e-mail confirmed');
    } catch (error: unknown) {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Confirm new e-mail failed',
      );
      throw error;
    }
  }

  async forgotPassword(dto: AuthForgotPasswordDto): Promise<void> {
    this.logger.debug({ email: dto.email }, 'Forgot password requested');

    try {
      const user = await this.findUserByOwnedVerifiedEmail(dto.email);

      if (!user) {
        this.logger.debug(
          { email: dto.email },
          'Forgot password user not found',
        );
        return;
      }

      if (!user.linkedProviders.includes(AuthProvidersEnum.email)) {
        this.logger.debug(
          { userId: user.id },
          'Forgot password ignored because e-mail provider is not linked',
        );
        return;
      }

      const nextForgotPasswordTokenVersion =
        user.forgotPasswordTokenVersion + 1;
      await this.usersService.update(user.id, {
        forgotPasswordTokenVersion: nextForgotPasswordTokenVersion,
      });

      const hash = await this.jwtService.signAsync(
        {
          forgotUserId: user.id,
          forgotPasswordTokenVersion: nextForgotPasswordTokenVersion,
        },
        {
          secret: this.configService.getOrThrow('AUTH_FORGOT_SECRET'),
          expiresIn: this.configService.getOrThrow('AUTH_FORGOT_EXPIRES_IN'),
        },
      );

      await this.mailService.send({
        to: dto.email,
        title: 'Redefina sua senha - Anubis',
        body: this.composeResetPasswordBody(hash),
      });

      this.logger.info({ userId: user.id }, 'Forgot password e-mail sent');
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          email: dto.email,
        },
        'Forgot password failed',
      );
      throw error;
    }
  }

  async resetPassword(dto: AuthResetPasswordDto): Promise<void> {
    this.logger.debug('Reset password requested');

    try {
      const token = await this.verifyForgotToken(dto.hash);
      const user = await this.usersService.findById(token.forgotUserId);

      if (!user) {
        throw new NotFoundException('Usuario nao encontrado.');
      }

      if (
        user.forgotPasswordTokenVersion !== token.forgotPasswordTokenVersion
      ) {
        throw new BadRequestException(
          'Link de redefinicao de senha invalido ou expirado.',
        );
      }

      const hashedPassword = await bcrypt.hash(
        dto.password,
        BCRYPT_SALT_ROUNDS,
      );
      await this.usersService.update(user.id, {
        password: hashedPassword,
        mustChangePassword: false,
        bootstrapPasswordExpiresAt: null,
        forgotPasswordTokenVersion: token.forgotPasswordTokenVersion + 1,
      });
      await this.sessionService.deleteByUserId(user.id);

      this.logger.info({ userId: user.id }, 'Password reset completed');
    } catch (error: unknown) {
      this.logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        'Reset password failed',
      );
      throw error;
    }
  }

  async linkEmailProvider(
    userId: string,
    sessionId: string,
    dto: AuthLinkEmailProviderDto,
  ): Promise<User> {
    this.logger.debug(
      { userId, provider: dto.provider },
      'E-mail provider link requested',
    );

    try {
      const user = await this.usersService.findById(userId);

      if (!user) {
        throw new NotFoundException('Usuario nao encontrado.');
      }

      if (!user.email) {
        throw new BadRequestException(
          'Conta sem e-mail definido. Atualize seu perfil antes de vincular e-mail/senha.',
        );
      }

      const hasEmailProvider = await this.usersService.hasProviderAccount({
        userId,
        provider: AuthProvidersEnum.email,
      });

      if (hasEmailProvider) {
        throw new ConflictException('Conta de e-mail/senha ja vinculada.');
      }

      const nonEmailProviders = user.linkedProviders.filter(
        (provider) => provider !== AuthProvidersEnum.email,
      );

      if (dto.provider === AuthProvidersEnum.email) {
        throw new BadRequestException(
          'Provedor de prova deve ser social e ja vinculado.',
        );
      }

      if (!nonEmailProviders.includes(dto.provider)) {
        throw new BadRequestException(
          'Provedor informado nao esta vinculado ao usuario autenticado para prova de posse.',
        );
      }

      const selectedOwnedEmail = await this.resolveOwnedEmailSelectionForLink(
        user,
        dto,
      );

      await this.validateProviderProof(user.id, dto);

      const hashedPassword = await bcrypt.hash(
        dto.password,
        BCRYPT_SALT_ROUNDS,
      );
      await this.usersService.update(user.id, { password: hashedPassword });
      await this.usersService.linkProviderAccount({
        userId: user.id,
        provider: AuthProvidersEnum.email,
        socialId: null,
      });

      if (selectedOwnedEmail && !selectedOwnedEmail.isPrimary) {
        await this.promoteOwnedEmailToPrimary({
          userId: user.id,
          accountId: selectedOwnedEmail.accountId,
          email: selectedOwnedEmail.email,
        });
      }

      await this.sessionService.deleteByUserIdWithExclude({
        userId: user.id,
        excludeSessionId: sessionId,
      });

      const updated = await this.usersService.findById(user.id);

      if (!updated) {
        throw new NotFoundException('Usuario nao encontrado.');
      }

      this.logger.info({ userId }, 'E-mail provider linked');
      return updated;
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
          provider: dto.provider,
        },
        'E-mail provider link failed',
      );
      throw error;
    }
  }

  private async validateProviderProof(
    userId: string,
    dto: AuthLinkEmailProviderDto,
  ): Promise<void> {
    if (dto.provider === AuthProvidersEnum.google) {
      if (!dto.providerToken) {
        throw new BadRequestException(
          'Token de prova do provedor e obrigatorio.',
        );
      }

      const socialData = await this.authGoogleService.getProfileByToken({
        idToken: dto.providerToken,
      });

      const linkedUser = await this.usersService.findByProviderAccount({
        provider: AuthProvidersEnum.google,
        socialId: socialData.id,
      });

      if (!linkedUser || linkedUser.id !== userId) {
        throw new BadRequestException(
          'Nao foi possivel validar prova de posse do provedor atual.',
        );
      }

      return;
    }

    throw new BadRequestException(
      'Prova de posse para provedor nao suportado.',
    );
  }

  private async findUserByOwnedVerifiedEmail(
    email: string,
  ): Promise<User | null> {
    const usersService = this.usersService as UsersService & {
      findUserByOwnedVerifiedEmail?: (email: string) => Promise<User | null>;
    };

    if (typeof usersService.findUserByOwnedVerifiedEmail === 'function') {
      return usersService.findUserByOwnedVerifiedEmail(email);
    }

    return this.usersService.findByEmail(email);
  }

  private async listUserOwnedEmails(user: User): Promise<
    Array<{
      accountId: string | null;
      email: string;
      normalizedEmail: string | null;
      verifiedAt: Date | null;
      isPrimary: boolean;
    }>
  > {
    const usersService = this.usersService as UsersService & {
      listUserEmails?: (userId: string) => Promise<
        Array<{
          accountId: string | null;
          email: string;
          normalizedEmail: string | null;
          verifiedAt: Date | null;
          isPrimary: boolean;
        }>
      >;
    };

    if (typeof usersService.listUserEmails === 'function') {
      return usersService.listUserEmails(user.id);
    }

    if (!user.email) {
      return [];
    }

    return [
      {
        accountId: null,
        email: user.email,
        normalizedEmail: user.email.toLowerCase(),
        verifiedAt: null,
        isPrimary: true,
      },
    ];
  }

  private async resolveOwnedEmailSelectionForLink(
    user: User,
    dto: AuthLinkEmailProviderDto,
  ): Promise<{
    accountId: string | null;
    email: string;
    normalizedEmail: string | null;
    verifiedAt: Date | null;
    isPrimary: boolean;
  } | null> {
    if (!dto.ownedEmailAccountId) {
      return null;
    }

    const ownedEmails = await this.listUserOwnedEmails(user);
    const selectedOwnedEmail = ownedEmails.find(
      (ownedEmail) => ownedEmail.accountId === dto.ownedEmailAccountId,
    );

    if (!selectedOwnedEmail || !selectedOwnedEmail.verifiedAt) {
      throw new BadRequestException(
        'Conta de e-mail informada para vinculacao e invalida.',
      );
    }

    return selectedOwnedEmail;
  }

  private async attachVerifiedOwnedEmail(params: {
    userId: string;
    email: string;
    normalizedEmail: string;
  }): Promise<{ accountId: string | null }> {
    const usersService = this.usersService as UsersService & {
      attachOwnedEmail?: (params: {
        userId: string;
        email: string;
        normalizedEmail: string;
        verifiedAt: Date;
      }) => Promise<{ accountId: string | null }>;
    };

    if (typeof usersService.attachOwnedEmail === 'function') {
      return usersService.attachOwnedEmail({
        userId: params.userId,
        email: params.email,
        normalizedEmail: params.normalizedEmail,
        verifiedAt: new Date(),
      });
    }

    return { accountId: null };
  }

  private async promoteOwnedEmailToPrimary(params: {
    userId: string;
    accountId: string | null;
    email: string;
  }): Promise<void> {
    const usersService = this.usersService as UsersService & {
      promoteOwnedEmailToPrimary?: (params: {
        userId: string;
        accountId: string;
      }) => Promise<User | null>;
    };

    if (typeof usersService.promoteOwnedEmailToPrimary === 'function') {
      if (!params.accountId) {
        throw new BadRequestException(
          'Nao foi possivel confirmar o novo e-mail informado.',
        );
      }

      const promoted = await usersService.promoteOwnedEmailToPrimary({
        userId: params.userId,
        accountId: params.accountId,
      });

      if (!promoted) {
        throw new BadRequestException(
          'Nao foi possivel confirmar o novo e-mail informado.',
        );
      }

      return;
    }

    await this.usersService.update(params.userId, { email: params.email });
  }

  private async verifyConfirmToken(hash: string): Promise<{
    confirmEmailUserId: string;
    confirmEmailTokenVersion: number;
  }> {
    try {
      return await this.jwtService.verifyAsync<{
        confirmEmailUserId: string;
        confirmEmailTokenVersion: number;
      }>(hash, {
        secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
      });
    } catch {
      throw new BadRequestException(
        'Link de confirmacao invalido ou expirado.',
      );
    }
  }

  private async verifyConfirmNewEmailToken(hash: string): Promise<{
    confirmEmailUserId: string;
    confirmEmailTokenVersion: number;
    newEmail: string;
  }> {
    try {
      return await this.jwtService.verifyAsync<{
        confirmEmailUserId: string;
        confirmEmailTokenVersion: number;
        newEmail: string;
      }>(hash, {
        secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
      });
    } catch {
      throw new BadRequestException(
        'Link de confirmacao invalido ou expirado.',
      );
    }
  }

  private async verifyForgotToken(hash: string): Promise<{
    forgotUserId: string;
    forgotPasswordTokenVersion: number;
  }> {
    try {
      return await this.jwtService.verifyAsync<{
        forgotUserId: string;
        forgotPasswordTokenVersion: number;
      }>(hash, {
        secret: this.configService.getOrThrow('AUTH_FORGOT_SECRET'),
      });
    } catch {
      throw new BadRequestException(
        'Link de redefinicao de senha invalido ou expirado.',
      );
    }
  }

  private composeConfirmEmailBody(hash: string): string {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const confirmUrl = `${frontendUrl}/auth/confirm-email?hash=${hash}`;

    return `<p>Obrigado por se cadastrar. Clique no link abaixo para confirmar seu email:</p><p><a href="${confirmUrl}">Confirmar email</a></p>`;
  }

  private composeResetPasswordBody(hash: string): string {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/auth/reset-password?hash=${hash}`;

    return `<p>Voce solicitou uma redefinicao de senha. Clique no link abaixo:</p><p><a href="${resetUrl}">Redefinir senha</a></p>`;
  }
}
