import { Injectable } from '@nestjs/common';
import { SessionRepository } from './infrastructure/persistence/session.repository';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  deleteByUserId(userId: string): Promise<void> {
    return this.sessionRepository.deleteByUserId(userId);
  }

  deleteByUserIdWithExclude(params: {
    userId: string;
    excludeSessionId: string;
  }): Promise<void> {
    return this.sessionRepository.deleteByUserIdWithExclude(params);
  }

  deleteById(sid: string): Promise<void> {
    return this.sessionRepository.deleteById(sid);
  }
}
