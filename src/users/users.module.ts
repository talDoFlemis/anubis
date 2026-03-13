import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/drizzle-persistence.module';
import { UserInfoMiddleware } from './user-info.middleware';

@Module({
  imports: [UserDrizzlePersistenceModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserInfoMiddleware).forRoutes('*');
  }
}
