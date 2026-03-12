import { Module } from '@nestjs/common';
import { UserRepository } from '../user.repository';
import { UserDrizzleRepository } from './user.drizzle-repository';

@Module({
  providers: [
    {
      provide: UserRepository,
      useClass: UserDrizzleRepository,
    },
  ],
  exports: [UserRepository],
})
export class UserDrizzlePersistenceModule {}
