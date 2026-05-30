import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { RoleEnum } from './roles.enum';
import { RolesGuard } from './roles.guard';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleEnum[]) => SetMetadata(ROLES_KEY, roles);

export const StaffOnly = () =>
  applyDecorators(
    UseGuards(RolesGuard),
    Roles(
      RoleEnum.professor,
      RoleEnum.mdccSecretary,
      RoleEnum.postGraduateCoordinator,
      RoleEnum.postGraduateViceCoordinator,
    ),
  );
