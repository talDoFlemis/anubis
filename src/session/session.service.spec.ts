import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import type { SessionRepository } from './infrastructure/persistence/session.repository';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;

  const sessionRepository: jest.Mocked<SessionRepository> = {
    deleteByUserId: jest.fn(),
    deleteByUserIdWithExclude: jest.fn(),
    deleteById: jest.fn(),
  };

  const baseUser = {
    id: 'user-1',
    role: RoleEnum.candidate,
    status: StatusEnum.active,
    onboardingCompleted: false,
    mustChangePassword: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SessionService(sessionRepository);
  });

  it('revokes all sessions when the role changes', () => {
    expect(
      service.resolveSnapshotChange({
        previousUser: baseUser,
        nextUser: {
          ...baseUser,
          role: RoleEnum.professor,
        },
      }),
    ).toEqual({
      revokeAllSessions: true,
      revokeOtherSessions: false,
      refreshCurrentSession: false,
    });
  });

  it('revokes all sessions when the user transitions to a non-active status', () => {
    expect(
      service.resolveSnapshotChange({
        previousUser: baseUser,
        nextUser: {
          ...baseUser,
          status: StatusEnum.inactive,
        },
      }),
    ).toEqual({
      revokeAllSessions: true,
      revokeOtherSessions: false,
      refreshCurrentSession: false,
    });
  });

  it('revokes sibling sessions when only the password changes', () => {
    expect(
      service.resolveSnapshotChange({
        previousUser: baseUser,
        nextUser: baseUser,
        passwordChanged: true,
      }),
    ).toEqual({
      revokeAllSessions: false,
      revokeOtherSessions: true,
      refreshCurrentSession: false,
    });
  });

  it('refreshes the current snapshot when onboarding completes', () => {
    expect(
      service.resolveSnapshotChange({
        previousUser: baseUser,
        nextUser: {
          ...baseUser,
          onboardingCompleted: true,
        },
      }),
    ).toEqual({
      revokeAllSessions: false,
      revokeOtherSessions: false,
      refreshCurrentSession: true,
    });
  });

  it('refreshes the current snapshot when mustChangePassword clears after a password reset', () => {
    expect(
      service.resolveSnapshotChange({
        previousUser: {
          ...baseUser,
          mustChangePassword: true,
        },
        nextUser: baseUser,
        passwordChanged: true,
      }),
    ).toEqual({
      revokeAllSessions: false,
      revokeOtherSessions: true,
      refreshCurrentSession: true,
    });
  });
});
