import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ProfessorDrizzlePersistenceModule } from './infraestructure/persistence/drizzle/ProfessorDrizzlePersistenceModule';
import { ProfessorController } from './professor.controller';
import { ProfessorService } from './professor.service';

@Module({
  imports: [ProfessorDrizzlePersistenceModule, UsersModule],
  providers: [ProfessorService],
  exports: [ProfessorService],
  controllers: [ProfessorController],
})
export class ProfessorModule {}
