export abstract class SessionRepository {
  abstract deleteByUserId(userId: string): Promise<void>;

  abstract deleteByUserIdWithExclude(params: {
    userId: string;
    excludeSessionId: string;
  }): Promise<void>;

  abstract deleteById(sid: string): Promise<void>;
}
