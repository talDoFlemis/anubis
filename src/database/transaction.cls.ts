import { AsyncLocalStorage } from 'node:async_hooks';
import type { DrizzleDB } from './drizzle.provider';

export interface TransactionStore {
  tx: DrizzleDB;
}

export const transactionStorage = new AsyncLocalStorage<TransactionStore>();

/**
 * Returns the current request-scoped transaction if running inside one,
 * otherwise returns undefined (callers should fall back to the global db).
 */
export function getTransaction(): DrizzleDB | undefined {
  return transactionStorage.getStore()?.tx;
}
