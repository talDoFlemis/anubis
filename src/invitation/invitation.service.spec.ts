import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { InvitationService } from './invitation.service';

describe('InvitationService', () => {
  let service: InvitationService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationService,
        {
          provide: UsersService,
          useValue: {
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const map: Record<string, string> = {
                AUTH_CONFIRM_EMAIL_SECRET: 'confirm-secret',
                AUTH_CONFIRM_EMAIL_EXPIRES_IN: '1d',
                FRONTEND_URL: 'http://localhost:3000',
              };
              return map[key] ?? key;
            }),
          },
        },
        {
          provide: MailService,
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(InvitationService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
  });

  it('bumps token version, signs JWT, and sends invitation email', async () => {
    jwtService.signAsync.mockResolvedValue('signed-token');

    await service.sendInvitation({
      userId: 'user-1',
      email: 'test@ufc.br',
      currentTokenVersion: 0,
      onboardingPath: '/auth/onboarding/professor',
    });

    expect(usersService.update.mock.calls).toEqual([['user-1', { confirmEmailTokenVersion: 1 }]]);

    expect(jwtService.signAsync.mock.calls).toEqual([
      [
        { confirmEmailUserId: 'user-1', confirmEmailTokenVersion: 1 },
        { secret: 'confirm-secret', expiresIn: '1d' },
      ],
    ]);

    const mailPayload = mailService.send.mock.calls[0]?.[0];
    expect(mailPayload).toEqual(
      expect.objectContaining({
        to: 'test@ufc.br',
        title: 'Confirme seu email - Anubis',
      }),
    );
    expect(mailPayload.body).toContain('/auth/onboarding/professor?hash=signed-token');
  });

  it('uses custom email body when provided', async () => {
    jwtService.signAsync.mockResolvedValue('signed-token');

    await service.sendInvitation({
      userId: 'user-1',
      email: 'test@ufc.br',
      currentTokenVersion: 0,
      onboardingPath: '/auth/onboarding/secretary',
      emailBody: '<p>Custom body</p>',
    });

    const mailPayload = mailService.send.mock.calls[0]?.[0];
    expect(mailPayload.body).toBe('<p>Custom body</p>');
  });

  it('increments token version correctly from non-zero', async () => {
    jwtService.signAsync.mockResolvedValue('signed-token');

    await service.sendInvitation({
      userId: 'user-2',
      email: 'test2@ufc.br',
      currentTokenVersion: 5,
      onboardingPath: '/auth/onboarding/professor',
    });

    expect(usersService.update.mock.calls).toEqual([['user-2', { confirmEmailTokenVersion: 6 }]]);

    expect(jwtService.signAsync.mock.calls).toEqual([
      [
        { confirmEmailUserId: 'user-2', confirmEmailTokenVersion: 6 },
        { secret: 'confirm-secret', expiresIn: '1d' },
      ],
    ]);
  });
});
