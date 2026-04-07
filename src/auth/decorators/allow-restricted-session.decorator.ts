import { SetMetadata } from '@nestjs/common';
import type { RestrictedSessionReason } from '../guards/session-lifecycle.guard';
import { ALLOW_RESTRICTED_SESSION_KEY } from '../guards/session-lifecycle.guard';

export const AllowRestrictedSession = (...reasons: RestrictedSessionReason[]) =>
  SetMetadata(ALLOW_RESTRICTED_SESSION_KEY, reasons);
