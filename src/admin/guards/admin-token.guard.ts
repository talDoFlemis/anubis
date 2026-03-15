import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-admin-token'];
    const expected = this.configService.getOrThrow<string>('ADMIN_SECRET');

    if (!token || token !== expected) {
      throw new UnauthorizedException('Invalid or missing admin token');
    }

    return true;
  }
}
