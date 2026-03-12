import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/drizzle-persistence.module';

@Module({
  imports: [SessionDrizzlePersistenceModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
