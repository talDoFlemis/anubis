import { Module } from '@nestjs/common';
import { ProfessorRepository } from '../professor.repository';
import { ProfessorDrizzleRepository } from './ProfessorDrizzleRepository';

@Module({
  providers: [
    {
      provide: ProfessorRepository,
      useClass: ProfessorDrizzleRepository,
    },
  ],
  exports: [ProfessorRepository],
})
export class ProfessorDrizzlePersistenceModule {}
