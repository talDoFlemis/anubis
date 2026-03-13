import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
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
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException({
        errors: { email: 'emailOrPasswordInvalid' },
      });
    }

    if ((user.provider as AuthProvidersEnum) !== AuthProvidersEnum.email) {
      throw new BadRequestException({
        errors: { email: `needLoginViaProvider:${user.provider}` },
      });
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password ?? '',
    );

    if (!isValidPassword) {
      throw new BadRequestException({
        errors: { email: 'emailOrPasswordInvalid' },
      });
    }

    return {
      user,
      loginResponse: this.buildLoginResponse(user),
    };
  }

  async validateSocialLogin(
    authProvider: string,
    socialData: SocialInterface,
  ): Promise<{ user: User; loginResponse: LoginResponseDto }> {
    let user: User | null = null;
    const socialEmail = socialData.email?.toLowerCase();
    let userByEmail: User | null = null;

    if (socialEmail) {
      userByEmail = await this.usersService.findByEmail(socialEmail);
    }

    if (socialData.id) {
      user = await this.usersService.findBySocialIdAndProvider({
        socialId: socialData.id,
        provider: authProvider,
      });
    }

    if (user) {
      // Existing social user - update email if changed
      if (socialEmail && !userByEmail) {
        await this.usersService.update(user.id, { email: socialEmail });
        user.email = socialEmail;
      }
    } else if (userByEmail) {
      // Found user by email - link accounts
      user = userByEmail;
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
    }

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { user: 'userNotFound' },
      });
    }

    return {
      user,
      loginResponse: this.buildLoginResponse(user),
    };
  }

  async register(dto: AuthRegisterDto): Promise<void> {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException({
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
  }

  async confirmEmail(hash: string): Promise<void> {
    let userId: string;

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailUserId: string;
      }>(hash, {
        secret: this.configService.getOrThrow('AUTH_CONFIRM_EMAIL_SECRET'),
      });
      userId = jwtData.confirmEmailUserId;
    } catch {
      throw new BadRequestException({
        errors: { hash: 'invalidHash' },
      });
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException({
        errors: { hash: 'notFound' },
      });
    }

    this.logger.info('User exists');

    await this.usersService.update(user.id, { status: StatusEnum.active });
  }

  async confirmNewEmail(hash: string): Promise<void> {
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
      throw new BadRequestException({
        errors: { hash: 'invalidHash' },
      });
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException({
        errors: { hash: 'notFound' },
      });
    }

    await this.usersService.update(user.id, {
      email: newEmail,
      status: StatusEnum.active,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException({
        errors: { email: 'emailNotExists' },
      });
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
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    let userId: string;

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        forgotUserId: string;
      }>(hash, {
        secret: this.configService.getOrThrow('AUTH_FORGOT_SECRET'),
      });
      userId = jwtData.forgotUserId;
    } catch {
      throw new BadRequestException({
        errors: { hash: 'invalidHash' },
      });
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException({
        errors: { hash: 'notFound' },
      });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    await this.usersService.update(user.id, { password: hashedPassword });
    await this.sessionService.deleteByUserId(user.id);
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
      throw new NotFoundException({
        errors: { user: 'userNotFound' },
      });
    }

    await this.handlePasswordUpdate(sessionId, userDto, currentUser);

    if (userDto.email && userDto.email !== currentUser.email) {
      const userByEmail = await this.usersService.findByEmail(userDto.email);

      if (userByEmail && userByEmail.id !== currentUser.id) {
        throw new ConflictException({
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

    return this.usersService.findById(userId);
  }

  async softDelete(userId: string): Promise<void> {
    await this.sessionService.deleteByUserId(userId);
    await this.usersService.remove(userId);
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
      throw new BadRequestException({
        errors: { oldPassword: 'missingOldPassword' },
      });
    }

    if (!currentUser.password) {
      throw new BadRequestException({
        errors: { oldPassword: 'incorrectOldPassword' },
      });
    }

    const isValidOldPassword = await bcrypt.compare(
      userDto.oldPassword,
      currentUser.password,
    );

    if (!isValidOldPassword) {
      throw new BadRequestException({
        errors: { oldPassword: 'incorrectOldPassword' },
      });
    }

    await this.sessionService.deleteByUserIdWithExclude({
      userId: currentUser.id,
      excludeSessionId: sessionId,
    });
  }
}
