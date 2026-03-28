import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/drizzle-persistence.module';
import { UserInfoMiddleware } from './user-info.middleware';
import { UsersController } from './users.controller';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [UserDrizzlePersistenceModule, MailModule],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserInfoMiddleware).forRoutes('*');
  }
}
