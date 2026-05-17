import { Module } from '@nestjs/common';
import { InvitationModule } from '../invitation/invitation.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';
import { SecretaryController } from './secretary.controller';
import { SecretaryService } from './secretary.service';

@Module({
  imports: [UsersModule, InvitationModule, SessionModule],
  providers: [SecretaryService],
  exports: [SecretaryService],
  controllers: [SecretaryController],
})
export class SecretaryModule {}
