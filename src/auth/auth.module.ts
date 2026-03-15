import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { UsersModule } from '../users/users.module';
import { SessionModule } from '../session/session.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [UsersModule, SessionModule, MailModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, SessionAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
