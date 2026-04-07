import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { SessionLifecycleGuard } from './guards/session-lifecycle.guard';
import { UsersModule } from '../users/users.module';
import { SessionModule } from '../session/session.module';
import { MailModule } from '../mail/mail.module';
import { CandidateModule } from '../candidate/candidate.module';
import { SessionSerializer } from './session.serializer';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    UsersModule,
    CandidateModule,
    SessionModule,
    MailModule,
    JwtModule.register({}),
    PassportModule.register({ session: true }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionAuthGuard, SessionLifecycleGuard, SessionSerializer],
  exports: [AuthService, SessionAuthGuard, SessionLifecycleGuard],
})
export class AuthModule {}
