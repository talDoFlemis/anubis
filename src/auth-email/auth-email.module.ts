import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module';
import { CandidateModule } from '../candidate/candidate.module';
import { MailModule } from '../mail/mail.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';
import { AuthEmailGuard } from './auth-email.guard';
import { LocalStrategy } from '../auth/strategies/local.strategy';
import { AuthEmailController } from './auth-email.controller';
import { AuthEmailService } from './auth-email.service';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    CandidateModule,
    SessionModule,
    MailModule,
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthEmailController],
  providers: [AuthEmailService, LocalStrategy, AuthEmailGuard],
  exports: [AuthEmailService],
})
export class AuthEmailModule {}
