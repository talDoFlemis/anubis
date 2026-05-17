import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGoogleModule } from '../auth-google/auth-google.module';
import { AuthModule } from '../auth/auth.module';
import { CandidateModule } from '../candidate/candidate.module';
import { MailModule } from '../mail/mail.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';
import { AuthEmailController } from './auth-email.controller';
import { AuthEmailGuard } from './auth-email.guard';
import { AuthEmailService } from './auth-email.service';
import { AuthEmailStrategy } from './auth-email.strategy';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    AuthGoogleModule,
    CandidateModule,
    SessionModule,
    MailModule,
    JwtModule.register({}),
  ],
  controllers: [AuthEmailController],
  providers: [AuthEmailService, AuthEmailStrategy, AuthEmailGuard],
  exports: [AuthEmailService],
})
export class AuthEmailModule {}
