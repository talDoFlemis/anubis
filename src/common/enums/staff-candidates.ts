import { RoleEnum } from 'src/roles/roles.enum';

export const STAFF_CANDIDATE_ROLES = [
  RoleEnum.professor,
  RoleEnum.mdccSecretary,
  RoleEnum.postGraduateCoordinator,
  RoleEnum.postGraduateViceCoordinator,
] as const;
