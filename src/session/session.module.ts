import { Module } from '@nestjs/common';
import { SessionDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/drizzle-persistence.module';
import { SessionService } from './session.service';

@Module({
  imports: [SessionDrizzlePersistenceModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
