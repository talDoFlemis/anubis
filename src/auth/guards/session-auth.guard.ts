import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(SessionAuthGuard.name)
    private readonly logger: PinoLogger,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.session?.userId) {
      this.logger.warn('Unauthenticated request: no active session');
      throw new UnauthorizedException();
    }

    this.logger.debug(
      { userId: request.session.userId },
      'Session authenticated',
    );
    return true;
  }
}
