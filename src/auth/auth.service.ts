import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { MailService } from '../mail/mail.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRegisterDto } from './dto/auth-register.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { AuthProvidersEnum } from './auth-providers.enum';
import { SocialInterface } from '../social/interfaces/social.interface';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { User } from '../users/domain/user';
import { LoginResponseDto } from './dto/login-response.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<{
    user: User;
    loginResponse: LoginResponseDto;
  }> {
    this.logger.debug('Login attempt');

    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      this.logger.warn('Login failed: e-mail not found');
      throw new UnauthorizedException({
        message: 'E-mail ou senha inválidos.',
        errors: { email: 'emailOrPasswordInvalid' },
      });
    }

    if ((user.provider as AuthProvidersEnum) !== AuthProvidersEnum.email) {
      this.logger.warn(
        { userId: user.id, provider: user.provider },
        'Login failed: account registered via social provider',
      );
      throw new BadRequestException({
        message: `Esta conta utiliza login via ${user.provider}. Por favor, entre com esse método.`,
        errors: { email: `needLoginViaProvider:${user.provider}` },
      });
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password ?? '',
    );

    if (!isValidPassword) {
      this.logger.warn({ userId: user.id }, 'Login failed: incorrect password');
      throw new UnauthorizedException({
        message: 'E-mail ou senha inválidos.',
        errors: { email: 'emailOrPasswordInvalid' },
      });
    }

    if (user.status !== StatusEnum.active) {
      this.logger.warn(
        { userId: user.id, status: user.status },
        'Login failed: user account is inactive',
      );
      throw new UnauthorizedException({
        message:
          'Usuário inativo. Verifique seu e-mail para ativar sua conta ou entre em contato com um administrador.',
        errors: { user: 'userInactive' },
      });
    }

    this.logger.info({ userId: user.id }, 'Login successful');

    return {
      user,
      loginResponse: this.buildLoginResponse(user),
    };
  }

  async validateSocialLogin(
    authProvider: string,
    socialData: SocialInterface,
  ): Promise<{ user: User; loginResponse: LoginResponseDto }> {
    this.logger.debug(
      { provider: authProvider, socialId: socialData.id },
      'Social login attempt',
    );

    let user: User | null = null;
    const socialEmail = socialData.email?.toLowerCase();
    let userByEmail: User | null = null;

    if (socialEmail) {
      this.logger.debug('Looking up user by e-mail');
      userByEmail = await this.usersService.findByEmail(socialEmail);
    }

    if (socialData.id) {
      this.logger.debug(
        { provider: authProvider, socialId: socialData.id },
        'Looking up user by social id',
      );
      user = await this.usersService.findBySocialIdAndProvider({
        socialId: socialData.id,
        provider: authProvider,
      });
    }

    if (user) {
      // Existing social user - update email if changed
      if (socialEmail && !userByEmail) {
        this.logger.debug(
          { userId: user.id },
          'Updating e-mail for existing social user',
        );
        await this.usersService.update(user.id, { email: socialEmail });
        user.email = socialEmail;
      }
      this.logger.info(
        { userId: user.id, provider: authProvider },
        'Social login: existing user authenticated',
      );
    } else if (userByEmail) {
      // Found user by email - link accounts
      user = userByEmail;
      this.logger.info(
        { userId: user.id, provider: authProvider },
        'Social login: linked existing account by e-mail',
      );
      await this.usersService.update(user.id, {
        socialId: socialData.id,
        provider: authProvider,
      });
      user.socialId = socialData.id;
      user.provider = authProvider;
    } else if (socialData.id) {
      // Create a new user from social data
      user = await this.usersService.create({
        email: socialEmail ?? null,
        firstName: socialData.firstName ?? null,
        lastName: socialData.lastName ?? null,
        socialId: socialData.id,
        provider: authProvider,
        role: RoleEnum.candidate,
        status: StatusEnum.active,
      });
      this.logger.info(
        { userId: user.id, provider: authProvider },
        'Social login: new user created',
      );
    }

    if (!user) {
      this.logger.warn(
        { provider: authProvider },
        'Social login failed: could not resolve user from social data',
      );
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Não foi possível autenticar com os dados sociais fornecidos.',
        errors: { user: 'userNotFound' },
      });
    }

    return {
      user,
      loginResponse: this.buildLoginResponse(user),
    };
  }

  async register(dto: AuthRegisterDto): Promise<void> {
    this.logger.debug('Registration attempt');

    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      this.logger.warn(
        { userId: existingUser.id },
        'Registration failed: e-mail already in use',
      );
      throw new ConflictException({
        message: 'Este e-mail já está cadastrado.',
        errors: { email: 'emailAlreadyExists' },
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      provider: AuthProvidersEnum.email,
      role: RoleEnum.candidate,
      status: StatusEnum.inactive,
    });

    this.logger.info({ userId: user.id }, 'User registered successfully');

    const hash = await this.jwtService.signAsync(
      { confirmEmailUserId: user.id },
      {
        secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
        expiresIn: this.configService.getOrThrow(
          'AUTH_CONFIRM_EMAIL_EXPIRES_IN',
        ),
      },
    );

    await this.mailService.userSignUp({
      to: dto.email,
      data: { hash },
    });

    this.logger.info({ userId: user.id }, 'Confirmation e-mail sent');
  }

  async confirmEmail(hash: string): Promise<void> {
    this.logger.debug('E-mail confirmation attempt');

    let userId: string;

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailUserId: string;
      }>(hash, {
        secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
      });
      userId = jwtData.confirmEmailUserId;
    } catch {
      this.logger.warn('E-mail confirmation failed: invalid or expired hash');
      throw new BadRequestException({
        message: 'Link de confirmação inválido ou expirado.',
        errors: { hash: 'invalidHash' },
      });
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      this.logger.warn(
        { userId },
        'E-mail confirmation failed: user not found',
      );
      throw new NotFoundException({
        message: 'Usuário não encontrado.',
        errors: { hash: 'notFound' },
      });
    }

    await this.usersService.update(user.id, { status: StatusEnum.active });
    this.logger.info({ userId: user.id }, 'E-mail confirmed successfully');
  }

  async confirmNewEmail(hash: string): Promise<void> {
    this.logger.debug('New e-mail confirmation attempt');

    let userId: string;
    let newEmail: string;

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailUserId: string;
        newEmail: string;
      }>(hash, {
        secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
      });
      userId = jwtData.confirmEmailUserId;
      newEmail = jwtData.newEmail;
    } catch {
      this.logger.warn(
        'New e-mail confirmation failed: invalid or expired hash',
      );
      throw new BadRequestException({
        message: 'Link de confirmação inválido ou expirado.',
        errors: { hash: 'invalidHash' },
      });
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      this.logger.warn(
        { userId },
        'New e-mail confirmation failed: user not found',
      );
      throw new NotFoundException({
        message: 'Usuário não encontrado.',
        errors: { hash: 'notFound' },
      });
    }

    await this.usersService.update(user.id, {
      email: newEmail,
      status: StatusEnum.active,
    });
    this.logger.info({ userId: user.id }, 'New e-mail confirmed successfully');
  }

  async forgotPassword(email: string): Promise<void> {
    this.logger.debug('Forgot password request');

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Return silently to prevent user enumeration: do not reveal
      // whether the email address is registered.
      this.logger.debug(
        'Forgot password: e-mail not found, responding silently',
      );
      return;
    }

    const hash = await this.jwtService.signAsync(
      { forgotUserId: user.id },
      {
        secret: this.configService.getOrThrow('AUTH_FORGOT_SECRET'),
        expiresIn: this.configService.getOrThrow('AUTH_FORGOT_EXPIRES_IN'),
      },
    );

    await this.mailService.forgotPassword({
      to: email,
      data: { hash },
    });

    this.logger.info({ userId: user.id }, 'Password reset e-mail sent');
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    this.logger.debug('Password reset attempt');

    let userId: string;

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        forgotUserId: string;
      }>(hash, {
        secret: this.configService.getOrThrow('AUTH_FORGOT_SECRET'),
      });
      userId = jwtData.forgotUserId;
    } catch {
      this.logger.warn('Password reset failed: invalid or expired hash');
      throw new BadRequestException({
        message: 'Link de redefinição de senha inválido ou expirado.',
        errors: { hash: 'invalidHash' },
      });
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      this.logger.warn({ userId }, 'Password reset failed: user not found');
      throw new NotFoundException({
        message: 'Usuário não encontrado.',
        errors: { hash: 'notFound' },
      });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    await this.usersService.update(user.id, { password: hashedPassword });
    await this.sessionService.deleteByUserId(user.id);

    this.logger.info(
      { userId: user.id },
      'Password reset successfully; all sessions invalidated',
    );
  }

  async me(userId: string): Promise<User | null> {
    this.logger.debug({ userId }, 'Fetching current user profile');
    return this.usersService.findById(userId);
  }

  async update(
    userId: string,
    sessionId: string,
    userDto: AuthUpdateDto,
  ): Promise<User | null> {
    this.logger.debug({ userId }, 'Profile update attempt');

    const currentUser = await this.usersService.findById(userId);

    if (!currentUser) {
      this.logger.warn({ userId }, 'Profile update failed: user not found');
      throw new NotFoundException({
        message: 'Usuário não encontrado.',
        errors: { user: 'userNotFound' },
      });
    }

    await this.handlePasswordUpdate(sessionId, userDto, currentUser);

    if (userDto.email && userDto.email !== currentUser.email) {
      const userByEmail = await this.usersService.findByEmail(userDto.email);

      if (userByEmail && userByEmail.id !== currentUser.id) {
        this.logger.warn(
          { userId },
          'Profile update failed: new e-mail already in use',
        );
        throw new ConflictException({
          message: 'Este e-mail já está em uso por outra conta.',
          errors: { email: 'emailExists' },
        });
      }

      const hash = await this.jwtService.signAsync(
        { confirmEmailUserId: currentUser.id, newEmail: userDto.email },
        {
          secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
          expiresIn: this.configService.getOrThrow(
            'AUTH_CONFIRM_EMAIL_EXPIRES_IN',
          ),
        },
      );

      await this.mailService.confirmNewEmail({
        to: userDto.email,
        data: { hash },
      });

      this.logger.debug({ userId }, 'E-mail change confirmation sent');
    }

    const updatePayload: Record<string, unknown> = {};
    if (userDto.firstName !== undefined)
      updatePayload.firstName = userDto.firstName;
    if (userDto.lastName !== undefined)
      updatePayload.lastName = userDto.lastName;
    if (userDto.password) {
      updatePayload.password = await bcrypt.hash(
        userDto.password,
        BCRYPT_SALT_ROUNDS,
      );
    }

    if (Object.keys(updatePayload).length > 0) {
      await this.usersService.update(userId, updatePayload);
    }

    this.logger.info({ userId }, 'Profile updated successfully');

    return this.usersService.findById(userId);
  }

  async softDelete(userId: string): Promise<void> {
    await this.sessionService.deleteByUserId(userId);
    await this.usersService.remove(userId);
    this.logger.info(
      { userId },
      'Account soft-deleted and all sessions invalidated',
    );
  }

  private buildLoginResponse(user: User): LoginResponseDto {
    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
    };
  }

  private async handlePasswordUpdate(
    sessionId: string,
    userDto: AuthUpdateDto,
    currentUser: User,
  ) {
    if (!userDto.password) return;

    if (!userDto.oldPassword) {
      this.logger.warn(
        { userId: currentUser.id },
        'Password change failed: old password not provided',
      );
      throw new BadRequestException({
        message: 'É necessário informar a senha atual para alterá-la.',
        errors: { oldPassword: 'missingOldPassword' },
      });
    }

    if (!currentUser.password) {
      this.logger.warn(
        { userId: currentUser.id },
        'Password change failed: account has no password set',
      );
      throw new BadRequestException({
        message: 'Senha atual incorreta.',
        errors: { oldPassword: 'incorrectOldPassword' },
      });
    }

    const isValidOldPassword = await bcrypt.compare(
      userDto.oldPassword,
      currentUser.password,
    );

    if (!isValidOldPassword) {
      this.logger.warn(
        { userId: currentUser.id },
        'Password change failed: incorrect old password',
      );
      throw new BadRequestException({
        message: 'Senha atual incorreta.',
        errors: { oldPassword: 'incorrectOldPassword' },
      });
    }

    await this.sessionService.deleteByUserIdWithExclude({
      userId: currentUser.id,
      excludeSessionId: sessionId,
    });
  }
}
