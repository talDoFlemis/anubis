import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ROLES_KEY } from './roles.decorator';
import { RoleEnum } from './roles.enum';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectPinoLogger(RolesGuard.name)
    private readonly logger: PinoLogger,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const userRole = request.session?.userRole;

    if (!userRole || !requiredRoles.includes(userRole)) {
      this.logger.warn(
        {
          requiredRoles,
        },
        'Access denied: insufficient role',
      );
      const serializedUserRole = userRole ?? 'nao-autenticado';
      throw new ForbiddenException({
        message: `Permissões insuficientes: esperado permissões: ${requiredRoles.join(' ')}, mas foi encontrado ${serializedUserRole}`,
      });
    }

    this.logger.debug(
      { userId: request.session?.userId, userRole, requiredRoles },
      'Role check passed',
    );
    return true;
  }
}
