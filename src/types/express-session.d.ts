import 'express-session';
import type { User as AppUser } from '../users/domain/user';

declare global {
  namespace Express {
    class User extends AppUser {}
  }
}
