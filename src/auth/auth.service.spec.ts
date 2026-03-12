import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { MailService } from '../mail/mail.service';
import { AuthProvidersEnum } from './auth-providers.enum';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { User } from '../users/domain/user';

/* eslint-disable @typescript-eslint/unbound-method */

// Mock bcrypt at module level
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let sessionService: jest.Mocked<SessionService>;
  let mailService: jest.Mocked<MailService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    provider: AuthProvidersEnum.email,
    socialId: null,
    firstName: 'John',
    lastName: 'Doe',
    role: RoleEnum.candidate,
    status: StatusEnum.active,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            findBySocialIdAndProvider: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            deleteByUserId: jest.fn(),
            deleteByUserIdWithExclude: jest.fn(),
            deleteById: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            userSignUp: jest.fn(),
            forgotPassword: jest.fn(),
            confirmNewEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const config: Record<string, string> = {
                AUTH_CONFIRM_EMAIL_SECRET: 'confirm-secret',
                AUTH_CONFIRM_EMAIL_EXPIRES_IN: '1d',
                AUTH_FORGOT_SECRET: 'forgot-secret',
                AUTH_FORGOT_EXPIRES_IN: '1d',
                FRONTEND_URL: 'http://localhost:3000',
              };
              return config[key] ?? key;
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    sessionService = module.get(SessionService);
    mailService = module.get(MailService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validateLogin', () => {
    it('should return user and login response on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await authService.validateLogin({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toEqual(mockUser);
      expect(result.loginResponse).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        status: mockUser.status,
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(jest.mocked(bcrypt.compare)).toHaveBeenCalledWith(
        'password123',
        mockUser.password,
      );
    });

    it('should throw emailOrPasswordInvalid if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.validateLogin({
          email: 'notfound@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { email: 'emailOrPasswordInvalid' },
          }),
        }),
      );
    });

    it('should throw needLoginViaProvider if user registered via social provider', async () => {
      const socialUser: User = {
        ...mockUser,
        provider: AuthProvidersEnum.google,
      };
      usersService.findByEmail.mockResolvedValue(socialUser);

      await expect(
        authService.validateLogin({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { email: 'needLoginViaProvider:google' },
          }),
        }),
      );
    });

    it('should throw emailOrPasswordInvalid if user has no password', async () => {
      const noPasswordUser: User = { ...mockUser, password: null };
      usersService.findByEmail.mockResolvedValue(noPasswordUser);
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        authService.validateLogin({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { email: 'emailOrPasswordInvalid' },
          }),
        }),
      );
    });

    it('should throw emailOrPasswordInvalid if password is incorrect', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        authService.validateLogin({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            errors: { email: 'emailOrPasswordInvalid' },
          }),
        }),
      );
    });
  });

  describe('validateSocialLogin', () => {
    it('should return existing social user', async () => {
      const socialUser: User = {
        ...mockUser,
        provider: AuthProvidersEnum.google,
        socialId: 'google-123',
      };
      usersService.findBySocialIdAndProvider.mockResolvedValue(socialUser);
      usersService.findByEmail.mockResolvedValue(socialUser);

      const result = await authService.validateSocialLogin('google', {
        id: 'google-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result.user).toEqual(socialUser);
      expect(usersService.findBySocialIdAndProvider).toHaveBeenCalledWith({
        socialId: 'google-123',
        provider: 'google',
      });
    });

    it('should link accounts when user exists by email but not by social ID', async () => {
      usersService.findBySocialIdAndProvider.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.update.mockResolvedValue({
        ...mockUser,
        socialId: 'google-456',
        provider: 'google',
      });

      const result = await authService.validateSocialLogin('google', {
        id: 'google-456',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result.user.socialId).toBe('google-456');
      expect(result.user.provider).toBe('google');
      expect(usersService.update).toHaveBeenCalledWith(mockUser.id, {
        socialId: 'google-456',
        provider: 'google',
      });
    });

    it('should create new user when no existing user found', async () => {
      const newUser: User = {
        ...mockUser,
        id: 'new-uuid',
        email: 'new@example.com',
        provider: AuthProvidersEnum.google,
        socialId: 'google-789',
        status: StatusEnum.active,
      };
      usersService.findBySocialIdAndProvider.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(newUser);

      const result = await authService.validateSocialLogin('google', {
        id: 'google-789',
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(result.user).toEqual(newUser);
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        socialId: 'google-789',
        provider: 'google',
        role: RoleEnum.candidate,
        status: StatusEnum.active,
      });
    });

    it('should update email on existing social user if email changed and no conflict', async () => {
      const socialUser: User = {
        ...mockUser,
        provider: AuthProvidersEnum.google,
        socialId: 'google-123',
        email: 'old@example.com',
      };
      usersService.findBySocialIdAndProvider.mockResolvedValue(socialUser);
      usersService.findByEmail.mockResolvedValue(null); // no conflict
      usersService.update.mockResolvedValue({
        ...socialUser,
        email: 'new@example.com',
      });

      const result = await authService.validateSocialLogin('google', {
        id: 'google-123',
        email: 'new@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result.user.email).toBe('new@example.com');
      expect(usersService.update).toHaveBeenCalledWith(socialUser.id, {
        email: 'new@example.com',
      });
    });

    it('should throw when social data has no id and no user found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.validateSocialLogin('google', {
          id: '',
          email: 'test@example.com',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('register', () => {
    it('should register a new user and send confirmation email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      usersService.create.mockResolvedValue({
        ...mockUser,
        id: 'new-user-id',
        status: StatusEnum.inactive,
      });
      jwtService.signAsync.mockResolvedValue('confirm-token');
      mailService.userSignUp.mockResolvedValue(undefined);

      await authService.register({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(usersService.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'hashed-password',
        firstName: 'Jane',
        lastName: 'Doe',
        provider: AuthProvidersEnum.email,
        role: RoleEnum.candidate,
        status: StatusEnum.inactive,
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { confirmEmailUserId: 'new-user-id' },
        expect.objectContaining({ secret: 'confirm-secret' }),
      );
      expect(mailService.userSignUp).toHaveBeenCalledWith({
        to: 'new@example.com',
        data: { hash: 'confirm-token' },
      });
    });

    it('should throw if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('confirmEmail', () => {
    it('should confirm email and activate user', async () => {
      const inactiveUser: User = {
        ...mockUser,
        status: StatusEnum.inactive,
      };
      jwtService.verifyAsync.mockResolvedValue({
        confirmEmailUserId: 'user-uuid-1',
      });
      usersService.findById.mockResolvedValue(inactiveUser);
      usersService.update.mockResolvedValue({
        ...inactiveUser,
        status: StatusEnum.active,
      });

      await authService.confirmEmail('valid-hash');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-hash', {
        secret: 'confirm-secret',
      });
      expect(usersService.update).toHaveBeenCalledWith('user-uuid-1', {
        status: StatusEnum.active,
      });
    });

    it('should throw on invalid hash', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

      await expect(authService.confirmEmail('invalid-hash')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw if user not found or already active', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        confirmEmailUserId: 'user-uuid-1',
      });
      usersService.findById.mockResolvedValue(mockUser); // already active

      await expect(authService.confirmEmail('valid-hash')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('confirmNewEmail', () => {
    it('should update user email to new email', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        confirmEmailUserId: 'user-uuid-1',
        newEmail: 'newemail@example.com',
      });
      usersService.findById.mockResolvedValue(mockUser);
      usersService.update.mockResolvedValue({
        ...mockUser,
        email: 'newemail@example.com',
      });

      await authService.confirmNewEmail('valid-hash');

      expect(usersService.update).toHaveBeenCalledWith('user-uuid-1', {
        email: 'newemail@example.com',
        status: StatusEnum.active,
      });
    });

    it('should throw on invalid hash', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

      await expect(authService.confirmNewEmail('invalid-hash')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw if user not found', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        confirmEmailUserId: 'nonexistent',
        newEmail: 'newemail@example.com',
      });
      usersService.findById.mockResolvedValue(null);

      await expect(authService.confirmNewEmail('valid-hash')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password email', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('forgot-token');
      mailService.forgotPassword.mockResolvedValue(undefined);

      await authService.forgotPassword('test@example.com');

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { forgotUserId: mockUser.id },
        expect.objectContaining({ secret: 'forgot-secret' }),
      );
      expect(mailService.forgotPassword).toHaveBeenCalledWith({
        to: 'test@example.com',
        data: { hash: 'forgot-token' },
      });
    });

    it('should throw if email not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.forgotPassword('notfound@example.com'),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password and invalidate sessions', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        forgotUserId: 'user-uuid-1',
      });
      usersService.findById.mockResolvedValue(mockUser);
      jest
        .mocked(bcrypt.hash)
        .mockResolvedValue('new-hashed-password' as never);
      usersService.update.mockResolvedValue(mockUser);
      sessionService.deleteByUserId.mockResolvedValue(undefined);

      await authService.resetPassword('valid-hash', 'newpassword123');

      expect(usersService.update).toHaveBeenCalledWith('user-uuid-1', {
        password: 'new-hashed-password',
      });
      expect(sessionService.deleteByUserId).toHaveBeenCalledWith('user-uuid-1');
    });

    it('should throw on invalid hash', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

      await expect(
        authService.resetPassword('invalid-hash', 'newpassword123'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw if user not found', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        forgotUserId: 'nonexistent',
      });
      usersService.findById.mockResolvedValue(null);

      await expect(
        authService.resetPassword('valid-hash', 'newpassword123'),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('me', () => {
    it('should return user by id', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await authService.me('user-uuid-1');

      expect(result).toEqual(mockUser);
      expect(usersService.findById).toHaveBeenCalledWith('user-uuid-1');
    });

    it('should return null if user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      const result = await authService.me('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user name fields', async () => {
      const updatedUser: User = { ...mockUser, firstName: 'Updated' };
      // First call: initial lookup; second call: after update
      usersService.findById
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);
      usersService.update.mockResolvedValue(updatedUser);

      const result = await authService.update('user-uuid-1', 'session-1', {
        firstName: 'Updated',
      });

      expect(usersService.update).toHaveBeenCalledWith('user-uuid-1', {
        firstName: 'Updated',
      });
      expect(result?.firstName).toBe('Updated');
    });

    it('should change password when old password is valid', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
      jest.mocked(bcrypt.hash).mockResolvedValue('new-hashed-pw' as never);
      usersService.update.mockResolvedValue(mockUser);
      sessionService.deleteByUserIdWithExclude.mockResolvedValue(undefined);

      await authService.update('user-uuid-1', 'session-1', {
        password: 'newpassword',
        oldPassword: 'oldpassword',
      });

      expect(sessionService.deleteByUserIdWithExclude).toHaveBeenCalledWith({
        userId: 'user-uuid-1',
        excludeSessionId: 'session-1',
      });
      expect(usersService.update).toHaveBeenCalledWith('user-uuid-1', {
        password: 'new-hashed-pw',
      });
    });

    it('should throw if changing password without old password', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      await expect(
        authService.update('user-uuid-1', 'session-1', {
          password: 'newpassword',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw if old password is incorrect', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      jest.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        authService.update('user-uuid-1', 'session-1', {
          password: 'newpassword',
          oldPassword: 'wrongpassword',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should send confirmation email when email changes', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      usersService.findByEmail.mockResolvedValue(null);
      jwtService.signAsync.mockResolvedValue('email-change-token');
      mailService.confirmNewEmail.mockResolvedValue(undefined);
      usersService.update.mockResolvedValue(mockUser);

      await authService.update('user-uuid-1', 'session-1', {
        email: 'newemail@example.com',
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          confirmEmailUserId: 'user-uuid-1',
          newEmail: 'newemail@example.com',
        },
        expect.objectContaining({ secret: 'confirm-secret' }),
      );
      expect(mailService.confirmNewEmail).toHaveBeenCalledWith({
        to: 'newemail@example.com',
        data: { hash: 'email-change-token' },
      });
    });

    it('should throw if new email already taken by another user', async () => {
      const otherUser: User = { ...mockUser, id: 'other-uuid' };
      usersService.findById.mockResolvedValue(mockUser);
      usersService.findByEmail.mockResolvedValue(otherUser);

      await expect(
        authService.update('user-uuid-1', 'session-1', {
          email: 'taken@example.com',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw if user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        authService.update('nonexistent', 'session-1', {
          firstName: 'Test',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('softDelete', () => {
    it('should delete sessions and soft-delete user', async () => {
      sessionService.deleteByUserId.mockResolvedValue(undefined);
      usersService.remove.mockResolvedValue(undefined);

      await authService.softDelete('user-uuid-1');

      expect(sessionService.deleteByUserId).toHaveBeenCalledWith('user-uuid-1');
      expect(usersService.remove).toHaveBeenCalledWith('user-uuid-1');
    });
  });
});
