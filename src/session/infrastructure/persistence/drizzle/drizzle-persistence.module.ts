import { Module } from '@nestjs/common';
import { SessionRepository } from '../session.repository';
import { SessionDrizzleRepository } from './session.drizzle-repository';

@Module({
  providers: [
    {
      provide: SessionRepository,
      useClass: SessionDrizzleRepository,
    },
  ],
  exports: [SessionRepository],
})
export class SessionDrizzlePersistenceModule {}
