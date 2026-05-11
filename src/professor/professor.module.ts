import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { ProfessorDrizzlePersistenceModule } from './infraestructure/persistence/drizzle/ProfessorDrizzlePersistenceModule';
import { ProfessorController } from './professor.controller';
import { ProfessorService } from './professor.service';

@Module({
  imports: [ProfessorDrizzlePersistenceModule, UsersModule, MailModule, JwtModule.register({})],
  providers: [ProfessorService],
  exports: [ProfessorService],
  controllers: [ProfessorController],
})
export class ProfessorModule {}
