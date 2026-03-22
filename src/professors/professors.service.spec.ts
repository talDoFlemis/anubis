/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ProfessorsService } from './professors.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import * as bcrypt from 'bcrypt';
import { getLoggerToken } from 'nestjs-pino';

jest.mock('bcrypt', () => ({ hash: jest.fn() }));

describe('ProfessorsService', () => {
  let service: ProfessorsService;
  let usersService: jest.Mocked<UsersService>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessorsService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByCpf: jest.fn(),
            create: jest.fn(),
            linkProviderAccount: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: { send: jest.fn() },
        },
        {
          provide: getLoggerToken(ProfessorsService.name),
          useValue: {
            info: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProfessorsService);
    usersService = module.get(UsersService);
    mailService = module.get(MailService);
  });

  it('invites professor with temporary credential expiration', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.findByCpf.mockResolvedValue(null);
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-temp-password' as never);
    usersService.create.mockResolvedValue({
      id: 'prof-1',
      email: 'prof@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      password: 'hashed-temp-password',
      cpf: null,
      role: RoleEnum.professor,
      status: StatusEnum.active,
      onboardingCompleted: true,
      mustChangePassword: true,
      bootstrapPasswordExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
      confirmEmailTokenVersion: 0,
      forgotPasswordTokenVersion: 0,
      linkedProviders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await service.inviteProfessor({
      email: 'prof@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(usersService.create).toHaveBeenCalled();
    const createPayload = usersService.create.mock.calls[0]?.[0];
    expect(createPayload).toBeDefined();
    expect(createPayload?.role).toBe(RoleEnum.professor);
    expect(createPayload?.mustChangePassword).toBe(true);
    expect(createPayload?.bootstrapPasswordExpiresAt).toBeInstanceOf(Date);
    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'prof@example.com' }),
    );
  });

  it('rejects invite when e-mail already exists', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'existing' } as never);

    await expect(
      service.inviteProfessor({
        email: 'prof@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
