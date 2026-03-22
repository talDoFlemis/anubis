import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.resolveMessage(exception, status);

    if (status >= (HttpStatus.INTERNAL_SERVER_ERROR as number)) {
      this.logger.error(
        { err: exception, path: request.url, method: request.method },
        'Unhandled exception',
      );
    }

    response.status(status).json({ message });
  }

  private resolveMessage(
    exception: unknown,
    status: number,
  ): string | string[] {
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'Internal server error';
    }

    if (!(exception instanceof HttpException)) {
      return 'An error occurred';
    }

    return (
      this.extractResponseMessage(exception.getResponse()) ??
      exception.message ??
      'An error occurred'
    );
  }

  private extractResponseMessage(response: unknown): string | string[] | null {
    if (typeof response === 'string') {
      return response;
    }

    if (response && typeof response === 'object') {
      const payload = response as Record<string, unknown>;

      if ('message' in payload) {
        const message = payload.message;
        if (typeof message === 'string' || Array.isArray(message)) {
          return message;
        }
      }

      if ('error' in payload && typeof payload.error === 'string') {
        return payload.error;
      }
    }

    return null;
  }
}
