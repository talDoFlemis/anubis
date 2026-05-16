import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(
    @InjectPinoLogger(HttpLoggerMiddleware.name)
    private readonly logger: PinoLogger,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = randomUUID();

    this.logger.assign({ requestId });

    this.logger.debug(
      {
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        remoteAddress: req.socket?.remoteAddress,
        remotePort: req.socket?.remotePort,
      },
      'Incoming request',
    );

    const start = Date.now();

    res.on('finish', () => {
      this.logger.info(
        {
          method: req.method,
          url: req.url,
          query: req.query,
          params: req.params,
          remoteAddress: req.socket?.remoteAddress,
          remotePort: req.socket?.remotePort,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          duration: Date.now() - start,
        },
        'Request completed',
      );
    });

    next();
  }
}
