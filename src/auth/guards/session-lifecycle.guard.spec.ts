import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import {
  RestrictedSessionReason,
  SessionLifecycleGuard,
} from './session-lifecycle.guard';

describe('SessionLifecycleGuard', () => {
  let guard: SessionLifecycleGuard;
  let reflector: jest.Mocked<Reflector>;
  let logger: Pick<PinoLogger, 'debug' | 'error'>;

  const context = (session?: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ session }),
      }),
      getHandler: () => ({}),
      getClass: () => class TestClass {},
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    logger = {
      debug: jest.fn(),
      error: jest.fn(),
    };

    guard = new SessionLifecycleGuard(reflector, logger as PinoLogger);
  });

  it('allows unrestricted sessions from the stored snapshot', () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    expect(
      guard.canActivate(
        context({
          userId: 'user-1',
          onboardingCompleted: true,
          mustChangePassword: false,
        }),
      ),
    ).toBe(true);
  });

  it('blocks onboarding-incomplete sessions on disallowed routes', () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    expect(() =>
      guard.canActivate(
        context({
          userId: 'user-1',
          onboardingCompleted: false,
          mustChangePassword: false,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows onboarding-incomplete sessions on onboarding routes', () => {
    reflector.getAllAndOverride.mockReturnValue([
      RestrictedSessionReason.onboardingIncomplete,
    ]);

    expect(
      guard.canActivate(
        context({
          userId: 'user-1',
          onboardingCompleted: false,
          mustChangePassword: false,
        }),
      ),
    ).toBe(true);
  });

  it('keeps password-reset sessions blocked when only onboarding is allowed', () => {
    reflector.getAllAndOverride.mockReturnValue([
      RestrictedSessionReason.onboardingIncomplete,
    ]);

    expect(() =>
      guard.canActivate(
        context({
          userId: 'user-1',
          onboardingCompleted: false,
          mustChangePassword: true,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows password-reset sessions on password routes', () => {
    reflector.getAllAndOverride.mockReturnValue([
      RestrictedSessionReason.mustChangePassword,
    ]);

    expect(
      guard.canActivate(
        context({
          userId: 'user-1',
          onboardingCompleted: false,
          mustChangePassword: true,
        }),
      ),
    ).toBe(true);
  });

  it('rejects requests without an authenticated session snapshot', () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);
  });
});
