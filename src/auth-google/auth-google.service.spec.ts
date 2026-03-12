import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGoogleService } from './auth-google.service';

// Mock google-auth-library at module level
const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

describe('AuthGoogleService', () => {
  let service: AuthGoogleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGoogleService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const config: Record<string, string> = {
                GOOGLE_CLIENT_ID: 'test-client-id',
                GOOGLE_CLIENT_SECRET: 'test-client-secret',
              };
              return config[key] ?? key;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthGoogleService>(AuthGoogleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfileByToken', () => {
    it('should return social interface data for valid token', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-user-123',
          email: 'john@gmail.com',
          given_name: 'John',
          family_name: 'Doe',
        }),
      });

      const result = await service.getProfileByToken({
        idToken: 'valid-google-id-token',
      });

      expect(result).toEqual({
        id: 'google-user-123',
        email: 'john@gmail.com',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: 'valid-google-id-token',
        audience: ['test-client-id'],
      });
    });

    it('should handle token with minimal payload (no name)', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-user-456',
          email: 'minimal@gmail.com',
          given_name: undefined,
          family_name: undefined,
        }),
      });

      const result = await service.getProfileByToken({
        idToken: 'minimal-token',
      });

      expect(result).toEqual({
        id: 'google-user-456',
        email: 'minimal@gmail.com',
        firstName: undefined,
        lastName: undefined,
      });
    });

    it('should throw when payload is null (invalid token)', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => null,
      });

      await expect(
        service.getProfileByToken({ idToken: 'invalid-token' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should propagate error when verifyIdToken fails', async () => {
      mockVerifyIdToken.mockRejectedValue(
        new Error('Token verification failed'),
      );

      await expect(
        service.getProfileByToken({ idToken: 'expired-token' }),
      ).rejects.toThrow('Token verification failed');
    });
  });
});
