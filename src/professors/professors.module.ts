import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { RolesGuard } from '../roles/roles.guard';
import { ProfessorsController } from './professors.controller';
import { ProfessorsService } from './professors.service';

@Module({
  imports: [AuthModule, UsersModule, MailModule],
  controllers: [ProfessorsController],
  providers: [ProfessorsService, RolesGuard],
  exports: [ProfessorsService],
})
export class ProfessorsModule {}
