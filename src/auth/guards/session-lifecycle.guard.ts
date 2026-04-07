import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

export enum RestrictedSessionReason {
  onboardingIncomplete = 'onboardingIncomplete',
  mustChangePassword = 'mustChangePassword',
}

export const ALLOW_RESTRICTED_SESSION_KEY = 'allowRestrictedSession';

@Injectable()
export class SessionLifecycleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectPinoLogger(SessionLifecycleGuard.name)
    private readonly logger: PinoLogger,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const session = request.user;
    const userId = session?.id;

    if (!userId) {
      this.logger.error('Restricted-session guard denied unauthenticated access');
      throw new UnauthorizedException();
    }

    const allowedReasons =
      this.reflector.getAllAndOverride<RestrictedSessionReason[]>(ALLOW_RESTRICTED_SESSION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const reason = this.resolveRestrictionReason(session);
    if (!reason) {
      this.logger.debug({ userId }, 'Restricted-session guard passed');
      return true;
    }

    if (allowedReasons.includes(reason)) {
      this.logger.debug({ userId, reason }, 'Restricted-session guard allowed restricted route');
      return true;
    }

    this.logger.error({ userId, reason }, 'Restricted-session guard blocked access');
    throw new ForbiddenException(
      'Sessao autenticada com restricoes de seguranca. Conclua a etapa obrigatoria antes de acessar este recurso.',
    );
  }

  private resolveRestrictionReason(
    user:
      | {
          onboardingCompleted?: boolean;
          mustChangePassword?: boolean;
        }
      | null
      | undefined,
  ): RestrictedSessionReason | null {
    if (!user) {
      return null;
    }

    if (user.mustChangePassword) {
      return RestrictedSessionReason.mustChangePassword;
    }

    if (!user.onboardingCompleted) {
      return RestrictedSessionReason.onboardingIncomplete;
    }

    return null;
  }
}
