import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { DRIZZLE } from './drizzle.constants';
import type { DrizzleDB } from './drizzle.provider';
import { transactionStorage } from './transaction.cls';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { DrizzleSchema } from './drizzle.provider';

@Injectable()
export class TransactionMiddleware implements NestMiddleware {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  use(_req: Request, res: Response, next: NextFunction): void {
    const db = this.db as NodePgDatabase<DrizzleSchema>;

    db.transaction(async (tx) => {
      return new Promise<void>((resolve, reject) => {
        transactionStorage.run({ tx: tx as unknown as DrizzleDB }, () => {
          res.on('finish', () => {
            if (res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}`));
            } else {
              resolve();
            }
          });

          res.on('error', (err: Error) => {
            reject(err);
          });

          next();
        });
      });
    }).catch((err: Error) => {
      // Transaction was rolled back. If the response headers were already
      // sent (error triggered by res 'finish' event with 4xx/5xx), the
      // framework already handled the response -- do nothing.
      // Otherwise, forward the error to the NestJS exception pipeline.
      if (!res.headersSent) {
        next(err);
      }
    });
  }
}
