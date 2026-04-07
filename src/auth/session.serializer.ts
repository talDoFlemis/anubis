import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from 'src/users/users.service';
import type { User } from '../users/domain/user';

type SessionUserPayload = Pick<
  User,
  'id' | 'email' | 'role' | 'onboardingCompleted' | 'mustChangePassword' | 'status'
>;

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: User, done: (err: Error | null, payload: SessionUserPayload) => void): void {
    const payload: SessionUserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted,
      mustChangePassword: user.mustChangePassword,
      status: user.status,
    };

    done(null, payload);
  }

  async deserializeUser(
    payload: SessionUserPayload,
    done: (err: Error | null, user: User | null) => void,
  ): Promise<void> {
    const user = await this.usersService.findById(payload.id);
    done(null, user);
  }
}
