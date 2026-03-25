import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class UserInfoMiddleware implements NestMiddleware {
  constructor(
    @InjectPinoLogger(UserInfoMiddleware.name)
    private readonly logger: PinoLogger,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const userInfo: Record<string, string> = {};
    if (!req.user) {
      return next();
    }

    userInfo.email = req.user.id;
    userInfo.role = req.user.role;
    this.logger.assign({ userInfo });
    this.logger.debug('Attached user info with success');

    next();
  }
}
