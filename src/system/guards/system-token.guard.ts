import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class SystemTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-system-token'];
    const expected = this.configService.getOrThrow<string>('SYSTEM_SECRET');

    if (!token || token !== expected) {
      throw new UnauthorizedException('Invalid or missing system token');
    }

    return true;
  }
}
