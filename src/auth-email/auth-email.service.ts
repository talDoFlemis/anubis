import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { comparePassword, hashPassword } from 'src/utils/password';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { buildLoginResponse } from '../auth/login-response.builder';
import { CandidateService } from '../candidate/candidate.service';
import { MailService } from '../mail/mail.service';
import { RoleEnum } from '../roles/roles.enum';
import { SessionService } from '../session/session.service';
import { StatusEnum } from '../statuses/statuses.enum';
import { User } from '../users/domain/user';
import { UsersService } from '../users/users.service';
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { AuthResendProfessorOnboardingDto } from './dto/auth-resend-professor-onboarding.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { CompleteProfessorOnboardingDto } from './dto/complete-professor-onboarding.dto';
import { LoginResponseDto } from './dto/login-response.dto';

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

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<{
    user: User;
    loginResponse: LoginResponseDto;
  }> {
    this.logger.debug({ email: loginDto.email }, 'Email login attempt');

    try {
      const normalizedEmail = loginDto.email.toLowerCase().trim();
      const user = await this.usersService.findByEmail(normalizedEmail);

      if (!user) {
        throw new UnauthorizedException('E-mail ou senha invalidos.');
      }

      if (user.authProvider !== AuthProvidersEnum.email) {
        throw new UnauthorizedException(
          'Conta cadastrada com outro provedor. Use seu provedor original.',
        );
      }

      const isValidPassword = await comparePassword(loginDto.password, user.password ?? '');
      if (!isValidPassword) {
        throw new UnauthorizedException('E-mail ou senha invalidos.');
      }

      if (user.mustChangePassword) {
        if (
          user.bootstrapPasswordExpiresAt &&
          user.bootstrapPasswordExpiresAt.getTime() < Date.now()
        ) {
          throw new UnauthorizedException(
            'Senha temporaria expirada. Solicite redefinicao de senha para concluir acesso.',
          );
        }
      }

      if (user.status === StatusEnum.disabled) {
        throw new UnauthorizedException(
          'Usuario desativado. Entre em contato com a secretaria do programa.',
        );
      }

      if (user.status !== StatusEnum.active) {
        throw new UnauthorizedException(
          'Usuario inativo. Verifique seu e-mail para ativar sua conta ou entre em contato com um administrador.',
        );
      }

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
    const normalizedEmail = dto.email.toLowerCase().trim();
    this.logger.debug({ email: normalizedEmail }, 'Candidate e-mail registration');

    try {
      const existingUser = await this.usersService.findByEmail(normalizedEmail);
      if (existingUser) {
        throw new ConflictException(
          existingUser.authProvider === AuthProvidersEnum.email
            ? 'Este e-mail ja esta cadastrado.'
            : `Este e-mail ja pertence a uma conta criada com ${existingUser.authProvider}. Use seu provedor original.`,
        );
      }

      const existingCpf = await this.usersService.findByCpf(dto.cpf);
      if (existingCpf) {
        throw new ConflictException('Este CPF ja esta cadastrado.');
      }

      const hashedPassword = await hashPassword(dto.password);
      const user = await this.usersService.create({
        email: normalizedEmail,
        password: hashedPassword,
        cpf: dto.cpf,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: RoleEnum.candidate,
        status: StatusEnum.inactive,
        authProvider: AuthProvidersEnum.email,
        providerSubject: normalizedEmail,
        onboardingCompleted: true,
        mustChangePassword: false,
        confirmEmailTokenVersion: 0,
        forgotPasswordTokenVersion: 0,
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
          expiresIn: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_EXPIRES_IN'),
        },
      );

      await this.mailService.send({
        to: normalizedEmail,
        title: 'Confirme seu email - Anubis',
        body: this.composeConfirmEmailBody(hash),
      });
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          email: normalizedEmail,
        },
        'Candidate e-mail registration failed',
      );
      throw error;
    }
  }

  async confirmEmail(dto: AuthConfirmEmailDto): Promise<void> {
    const token = await this.verifyConfirmToken(dto.hash);
    const user = await this.usersService.findById(token.confirmEmailUserId);

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    if (user.status === StatusEnum.active) {
      return;
    }

    if (user.confirmEmailTokenVersion !== token.confirmEmailTokenVersion) {
      throw new BadRequestException('Link de confirmacao invalido ou expirado.');
    }

    await this.usersService.update(user.id, {
      status: StatusEnum.active,
      confirmEmailTokenVersion: token.confirmEmailTokenVersion + 1,
    });
  }

  async completeProfessorOnboarding(dto: CompleteProfessorOnboardingDto): Promise<void> {
    const token = await this.verifyConfirmToken(dto.hash);
    const user = await this.usersService.findById(token.confirmEmailUserId);

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    if (user.authProvider !== AuthProvidersEnum.email) {
      throw new BadRequestException(
        'Conta cadastrada com outro provedor. Use seu provedor original.',
      );
    }

    if (user.confirmEmailTokenVersion !== token.confirmEmailTokenVersion) {
      throw new BadRequestException('Link de confirmacao invalido ou expirado.');
    }

    if (user.password && !user.mustChangePassword) {
      return;
    }

    const hashedPassword = await hashPassword(dto.password);
    await this.usersService.update(user.id, {
      password: hashedPassword,
      status: StatusEnum.active,
      mustChangePassword: false,
      bootstrapPasswordExpiresAt: null,
      confirmEmailTokenVersion: token.confirmEmailTokenVersion + 1,
    });
  }

  async resendProfessorOnboarding(dto: AuthResendProfessorOnboardingDto): Promise<void> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user || user.authProvider !== AuthProvidersEnum.email) {
      return;
    }

    if (user.role !== RoleEnum.professor) {
      return;
    }

    if (user.password && !user.mustChangePassword) {
      return;
    }

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
        expiresIn: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_EXPIRES_IN'),
      },
    );

    await this.mailService.send({
      to: normalizedEmail,
      title: 'Confirme seu email - Anubis',
      body: this.composeProfessorOnboardingEmailBody(hash),
    });
  }

  async confirmNewEmail(dto: AuthConfirmEmailDto): Promise<void> {
    const token = await this.verifyConfirmToken(dto.hash);

    if (!token.newEmail) {
      throw new BadRequestException('Link de confirmacao invalido ou expirado.');
    }

    const user = await this.usersService.findById(token.confirmEmailUserId);
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    if (user.confirmEmailTokenVersion !== token.confirmEmailTokenVersion) {
      throw new BadRequestException('Link de confirmacao invalido ou expirado.');
    }

    const normalizedEmail = token.newEmail.toLowerCase().trim();
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictException('Este e-mail ja esta em uso por outra conta.');
    }

    await this.usersService.update(user.id, {
      email: normalizedEmail,
      providerSubject:
        user.authProvider === AuthProvidersEnum.email ? normalizedEmail : user.providerSubject,
      status: StatusEnum.active,
      confirmEmailTokenVersion: token.confirmEmailTokenVersion + 1,
    });
  }

  async forgotPassword(dto: AuthForgotPasswordDto): Promise<void> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user || user.authProvider !== AuthProvidersEnum.email) {
      return;
    }

    const nextForgotPasswordTokenVersion = user.forgotPasswordTokenVersion + 1;
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
      to: normalizedEmail,
      title: 'Redefina sua senha - Anubis',
      body: this.composeResetPasswordBody(hash),
    });
  }

  async resetPassword(dto: AuthResetPasswordDto): Promise<void> {
    const token = await this.verifyForgotToken(dto.hash);
    const user = await this.usersService.findById(token.forgotUserId);

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    if (user.authProvider !== AuthProvidersEnum.email) {
      throw new BadRequestException(
        'Conta cadastrada com outro provedor. Use seu provedor original.',
      );
    }

    if (user.forgotPasswordTokenVersion !== token.forgotPasswordTokenVersion) {
      throw new BadRequestException('Link de redefinicao de senha invalido ou expirado.');
    }

    const hashedPassword = await hashPassword(dto.password);
    await this.usersService.update(user.id, {
      password: hashedPassword,
      mustChangePassword: false,
      bootstrapPasswordExpiresAt: null,
      forgotPasswordTokenVersion: token.forgotPasswordTokenVersion + 1,
    });
    await this.sessionService.deleteByUserId(user.id);
  }

  private async verifyConfirmToken(hash: string): Promise<{
    confirmEmailUserId: string;
    confirmEmailTokenVersion: number;
    newEmail?: string;
  }> {
    try {
      return await this.jwtService.verifyAsync(hash, {
        secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
      });
    } catch {
      throw new BadRequestException('Link de confirmacao invalido ou expirado.');
    }
  }

  private async verifyForgotToken(hash: string): Promise<{
    forgotUserId: string;
    forgotPasswordTokenVersion: number;
  }> {
    try {
      return await this.jwtService.verifyAsync(hash, {
        secret: this.configService.getOrThrow('AUTH_FORGOT_SECRET'),
      });
    } catch {
      throw new BadRequestException('Link de redefinicao de senha invalido ou expirado.');
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

  private composeProfessorOnboardingEmailBody(hash: string): string {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const confirmUrl = `${frontendUrl}/auth/onboarding/professor?hash=${hash}`;

    return `<p>Voce foi cadastrado(a) na plataforma do MDCC. Clique no link abaixo para concluir o seu cadastro:</p><p><a href="${confirmUrl}">Confirmar email</a></p>`;
  }
}
