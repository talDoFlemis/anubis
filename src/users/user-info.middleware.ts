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
    void res;
    const userInfo: Record<string, string> = {};
    if (!req.user) {
      return next();
    }

    userInfo.id = req.user.id;
    if (typeof req.user.email === 'string' && req.user.email.length > 0) {
      userInfo.email = req.user.email;
    }
    userInfo.role = req.user.role;
    this.logger.assign({ userInfo });
    this.logger.debug('Attached user info with success');

    next();
  }
}
