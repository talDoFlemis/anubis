import 'express-session';
import type { RoleEnum } from '../roles/roles.enum';
import type { StatusEnum } from '../statuses/statuses.enum';
import type { User as AppUser } from '../users/domain/user';

declare global {
  namespace Express {
    class User extends AppUser {}
  }
}
