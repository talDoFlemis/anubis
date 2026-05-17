import { Module } from '@nestjs/common';
import { InvitationModule } from '../invitation/invitation.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';
import { ProfessorDrizzlePersistenceModule } from './infraestructure/persistence/drizzle/ProfessorDrizzlePersistenceModule';
import { ProfessorController } from './professor.controller';
import { ProfessorService } from './professor.service';

@Module({
  imports: [ProfessorDrizzlePersistenceModule, UsersModule, InvitationModule, SessionModule],
  providers: [ProfessorService],
  exports: [ProfessorService],
  controllers: [ProfessorController],
})
export class ProfessorModule {}
