import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/drizzle-persistence.module';

@Module({
  imports: [UserDrizzlePersistenceModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
