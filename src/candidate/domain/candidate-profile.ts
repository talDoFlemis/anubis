import type { RoleEnum } from '../../roles/roles.enum';
import type { StatusEnum } from '../../statuses/statuses.enum';

export class CandidateProfile {
  userId!: string;
  email!: string | null;
  cpf!: string | null;
  firstName!: string | null;
  lastName!: string | null;
  role!: RoleEnum;
  status!: StatusEnum;
  onboardingCompleted!: boolean;
  universityOfOrigin!: string;
  ira!: string | null;
  poscomp!: number | null;
  createdAt!: Date;
  updatedAt!: Date;
}
