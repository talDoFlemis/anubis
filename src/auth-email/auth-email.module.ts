import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { AuthGoogleModule } from '../auth-google/auth-google.module';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { SessionLifecycleGuard } from '../auth/guards/session-lifecycle.guard';
import { CandidateModule } from '../candidate/candidate.module';
import { MailModule } from '../mail/mail.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';
import { AuthEmailController } from './auth-email.controller';
import { AuthEmailService } from './auth-email.service';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    CandidateModule,
    SessionModule,
    MailModule,
    AuthGoogleModule,
    JwtModule.register({}),
  ],
  controllers: [AuthEmailController],
  providers: [AuthEmailService, SessionAuthGuard, SessionLifecycleGuard],
  exports: [AuthEmailService],
})
export class AuthEmailModule {}
