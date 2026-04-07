import type { Provider } from '@nestjs/common';
import { DRIZZLE, DRIZZLE_TX } from './drizzle.constants';
import type { DrizzleDB } from './drizzle.provider';
import { getTransaction } from './transaction.cls';

/**
 * Provides a transaction-aware Drizzle DB handle via `DRIZZLE_TX`.
 *
 * Uses a Proxy so the provider can remain singleton-scoped while lazily
 * resolving to the per-request CLS transaction at access time. If no
 * transaction is active (e.g. outside an HTTP request), it falls back
 * to the global DB instance.
 */
export const drizzleTxProvider: Provider = {
  provide: DRIZZLE_TX,
  inject: [DRIZZLE],
  useFactory: (db: DrizzleDB): DrizzleDB => {
    return new Proxy({} as DrizzleDB, {
      get(_target, prop, receiver): unknown {
        const current = getTransaction() ?? db;
        return Reflect.get(current, prop, receiver) as unknown;
      },
    });
  },
};
