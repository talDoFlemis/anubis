import { Injectable } from '@nestjs/common';
import { StatusEnum } from '../statuses/statuses.enum';
import { SessionRepository } from './infrastructure/persistence/session.repository';

type SessionSnapshotUser = {
  id: string;
  role: string;
  status: StatusEnum;
  onboardingCompleted: boolean;
  mustChangePassword: boolean;
};

type SessionSnapshotChange = {
  revokeAllSessions: boolean;
  revokeOtherSessions: boolean;
  refreshCurrentSession: boolean;
};

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  resolveSnapshotChange(params: {
    previousUser: SessionSnapshotUser;
    nextUser: SessionSnapshotUser;
    passwordChanged?: boolean;
  }): SessionSnapshotChange {
    const { previousUser, nextUser, passwordChanged = false } = params;

    if (this.requiresFullRevocation(previousUser, nextUser)) {
      return {
        revokeAllSessions: true,
        revokeOtherSessions: false,
        refreshCurrentSession: false,
      };
    }

    return {
      revokeAllSessions: false,
      revokeOtherSessions: passwordChanged,
      refreshCurrentSession: this.didSnapshotChange(previousUser, nextUser),
    };
  }

  deleteByUserId(userId: string): Promise<void> {
    return this.sessionRepository.deleteByUserId(userId);
  }

  deleteByUserIdWithExclude(params: { userId: string; excludeSessionId: string }): Promise<void> {
    return this.sessionRepository.deleteByUserIdWithExclude(params);
  }

  deleteById(sid: string): Promise<void> {
    return this.sessionRepository.deleteById(sid);
  }

  private requiresFullRevocation(
    previousUser: SessionSnapshotUser,
    nextUser: SessionSnapshotUser,
  ): boolean {
    if (previousUser.role !== nextUser.role) {
      return true;
    }

    return previousUser.status !== nextUser.status && nextUser.status !== StatusEnum.active;
  }

  private didSnapshotChange(
    previousUser: SessionSnapshotUser,
    nextUser: SessionSnapshotUser,
  ): boolean {
    return (
      previousUser.role !== nextUser.role ||
      previousUser.status !== nextUser.status ||
      previousUser.onboardingCompleted !== nextUser.onboardingCompleted ||
      previousUser.mustChangePassword !== nextUser.mustChangePassword
    );
  }
}
