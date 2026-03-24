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
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthLinkEmailProviderDto } from './dto/auth-link-email-provider.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { buildLoginResponse } from '../auth/login-response.builder';
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
    @InjectPinoLogger(AuthEmailService.name)
    private readonly logger: PinoLogger,
  ) {}

  async login(loginDto: AuthEmailLoginDto): Promise<{
    user: User;
    loginResponse: LoginResponseDto;
  }> {
    this.logger.debug({ email: loginDto.email }, 'Email login attempt');

    try {
      const user = await this.usersService.findByProviderAccount({
        providerId: loginDto.email,
        provider: AuthProvidersEnum.email,
      });
      if (!user) {
        throw new UnauthorizedException('E-mail ou senha invalidos.');
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
      const existingUser = await this.usersService.findByProviderAccount({
        providerId: dto.email,
        provider: AuthProvidersEnum.email,
      });

      if (existingUser) {
        throw new ConflictException('Este e-mail já esta cadastrado.');
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
        providerId: user.email,
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
        this.logger.debug('E-mail already confirmed');
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

  async forgotPassword(dto: AuthForgotPasswordDto): Promise<void> {
    this.logger.debug({ email: dto.email }, 'Forgot password requested');

    try {
      const user = await this.usersService.findByProviderAccount({
        providerId: dto.email,
        provider: AuthProvidersEnum.email,
      });

      if (!user) {
        this.logger.debug(
          { email: dto.email },
          'Forgot password user not found',
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
  ): Promise<void> {
    this.logger.debug(
      { userId, provider: dto.provider },
      'E-mail provider link requested',
    );

    try {
      const user = await this.usersService.findById(userId);

      if (!user) {
        throw new NotFoundException('Usuario nao encontrado.');
      }

      const hasEmailProvider = await this.usersService.hasProviderAccount({
        userId,
        provider: AuthProvidersEnum.email,
      });

      if (hasEmailProvider) {
        throw new ConflictException('Conta de e-mail/senha ja vinculada.');
      }

      const hashedPassword = await bcrypt.hash(
        dto.password,
        BCRYPT_SALT_ROUNDS,
      );
      await this.usersService.update(user.id, { password: hashedPassword });
      await this.usersService.linkProviderAccount({
        userId: user.id,
        provider: AuthProvidersEnum.email,
        providerId: user.email,
      });

      await this.sessionService.deleteByUserIdWithExclude({
        userId: user.id,
        excludeSessionId: sessionId,
      });

      this.logger.info({ userId }, 'E-mail provider linked');
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
