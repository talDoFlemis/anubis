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
    if (req.session?.userId) userInfo.id = req.session.userId;
    if (req.session?.userRole) userInfo.role = req.session.userRole;

    if (Object.keys(userInfo).length > 0) {
      this.logger.assign({ userInfo });
      this.logger.debug('Attached user info with success');
    }

    next();
  }
}
