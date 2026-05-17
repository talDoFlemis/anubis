import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { InvitationService } from './invitation.service';

@Module({
  imports: [UsersModule, MailModule, JwtModule.register({})],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {}
