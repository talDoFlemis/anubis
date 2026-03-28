import { SetMetadata } from '@nestjs/common';
import {
  ALLOW_RESTRICTED_SESSION_KEY,
  RestrictedSessionReason,
} from '../guards/session-lifecycle.guard';

export const AllowRestrictedSession = (...reasons: RestrictedSessionReason[]) =>
  SetMetadata(ALLOW_RESTRICTED_SESSION_KEY, reasons);
