import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url } = request;
    const startTime = Date.now();

    this.logger.info('Incoming request', {
      method: method,
      url: url,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.info('Request finished', {
            method: method,
            url: url,
            duration_in_ms: duration,
            statusCode: response.statusCode,
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error('Request finished with error', {
            method: method,
            url: url,
            duration_in_ms: duration,
            statusCode: error.status || 500,
            errorMessage: error.message,
          });
        },
      }),
    );
  }
}
