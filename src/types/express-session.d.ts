import 'express-session';
import type { RoleEnum } from '../roles/roles.enum';
import type { StatusEnum } from '../statuses/statuses.enum';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    userRole: RoleEnum;
    role: RoleEnum;
    status: StatusEnum;
    onboardingCompleted: boolean;
    mustChangePassword: boolean;
  }
}
