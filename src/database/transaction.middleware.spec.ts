import { EventEmitter } from 'node:events';
import type { NextFunction, Request, Response } from 'express';
import { TransactionMiddleware } from './transaction.middleware';
import { transactionStorage } from './transaction.cls';
import type { DrizzleDB } from './drizzle.provider';

describe('TransactionMiddleware', () => {
  let middleware: TransactionMiddleware;
  let mockTx: DrizzleDB;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    mockTx = { fake: 'transaction' } as unknown as DrizzleDB;

    mockDb = {
      transaction: jest.fn((callback: (tx: DrizzleDB) => Promise<void>) => {
        return callback(mockTx);
      }),
    };

    middleware = new TransactionMiddleware(mockDb as unknown as DrizzleDB);
  });

  function createMockResponse(): Response & EventEmitter {
    const res = new EventEmitter() as Response & EventEmitter;
    res.statusCode = 200;
    res.headersSent = false;
    return res;
  }

  it('should begin a database transaction for each request', () => {
    const req = { method: 'POST', path: '/v1/auth/login' } as Request;
    const res = createMockResponse();
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should store the transaction in AsyncLocalStorage and call next', done => {
    const req = { method: 'POST', path: '/v1/auth/login' } as Request;
    const res = createMockResponse();

    const next = jest.fn(() => {
      // Inside next(), the CLS should have the transaction
      const store = transactionStorage.getStore();
      expect(store).toBeDefined();
      expect(store!.tx).toBe(mockTx);

      // Simulate successful response
      res.statusCode = 200;
      res.emit('finish');
    });

    mockDb.transaction.mockImplementation(async (callback: (tx: DrizzleDB) => Promise<void>) => {
      await callback(mockTx);
      done();
    });

    middleware.use(req, res, next);
  });

  it('should commit transaction when response status is < 400', done => {
    const req = { method: 'POST', path: '/v1/auth/login' } as Request;
    const res = createMockResponse();

    mockDb.transaction.mockImplementation(async (callback: (tx: DrizzleDB) => Promise<void>) => {
      // If the callback resolves, the transaction commits
      await callback(mockTx);
      // Reaching here means commit (no error thrown)
      done();
    });

    const next = jest.fn(() => {
      res.statusCode = 200;
      res.emit('finish');
    });

    middleware.use(req, res, next);
  });

  it('should rollback transaction when response status is >= 400', done => {
    const req = { method: 'POST', path: '/v1/auth/login' } as Request;
    const res = createMockResponse();
    res.headersSent = true;

    mockDb.transaction.mockImplementation(async (callback: (tx: DrizzleDB) => Promise<void>) => {
      try {
        await callback(mockTx);
        done.fail('Expected transaction to be rejected');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe('HTTP 422');
        done();
      }
    });

    const next = jest.fn(() => {
      res.statusCode = 422;
      res.emit('finish');
    });

    middleware.use(req, res, next);
  });

  it('should rollback transaction on response error event', done => {
    const req = { method: 'POST', path: '/v1/auth/login' } as Request;
    const res = createMockResponse();
    res.headersSent = true;
    const streamError = new Error('connection reset');

    mockDb.transaction.mockImplementation(async (callback: (tx: DrizzleDB) => Promise<void>) => {
      try {
        await callback(mockTx);
        done.fail('Expected transaction to be rejected');
      } catch (err) {
        expect(err).toBe(streamError);
        done();
      }
    });

    const next = jest.fn(() => {
      res.emit('error', streamError);
    });

    middleware.use(req, res, next);
  });

  it('should forward error to next() if response not yet sent', done => {
    const req = { method: 'POST', path: '/v1/auth/login' } as Request;
    const res = createMockResponse();
    res.headersSent = false;

    const transactionError = new Error('db error');

    mockDb.transaction.mockRejectedValue(transactionError);

    const next = jest.fn((...args: unknown[]) => {
      const err = args[0];
      if (err) {
        expect(err).toBe(transactionError);
        done();
      }
    });

    middleware.use(req, res, next as unknown as NextFunction);
  });

  it('should not call next(err) if headers already sent on rollback', done => {
    const req = { method: 'POST', path: '/v1/auth/login' } as Request;
    const res = createMockResponse();
    res.headersSent = true;

    mockDb.transaction.mockImplementation(async (callback: (tx: DrizzleDB) => Promise<void>) => {
      try {
        await callback(mockTx);
      } catch {
        // Transaction rolled back, fall through to .catch()
        throw new Error('rolled back');
      }
    });

    const next = jest.fn(() => {
      res.statusCode = 500;
      res.emit('finish');
    });

    // After the catch, next should NOT be called with an error
    // because headersSent is true
    mockDb.transaction.mockImplementation(async (callback: (tx: DrizzleDB) => Promise<void>) => {
      await callback(mockTx).catch(() => {
        // rolled back
      });
      throw new Error('rolled back');
    });

    middleware.use(req, res, next);

    // Give the promise chain time to settle
    setTimeout(() => {
      // next was called exactly once (the initial call), never with an error
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      done();
    }, 50);
  });
});
