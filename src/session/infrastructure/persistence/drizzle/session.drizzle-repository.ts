import { Inject, Injectable } from '@nestjs/common';
import { eq, sql, and, ne } from 'drizzle-orm';
import { DRIZZLE_TX } from '../../../../database/drizzle.constants';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import { sessions } from '../../../../database/schema/sessions';
import { SessionRepository } from '../session.repository';

@Injectable()
export class SessionDrizzleRepository extends SessionRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sql`sess->>'userId'`, userId));
  }

  async deleteByUserIdWithExclude(params: {
    userId: string;
    excludeSessionId: string;
  }): Promise<void> {
    await this.db
      .delete(sessions)
      .where(
        and(
          eq(sql`sess->>'userId'`, params.userId),
          ne(sessions.sid, params.excludeSessionId),
        ),
      );
  }

  async deleteById(sid: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.sid, sid));
  }
}
