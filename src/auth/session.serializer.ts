import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { on } from 'events';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }
  serializeUser(user: any, done: (err: Error, user: any) => void): any {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      onboardingComplete: user.onboardingComplete,
      mustChangePassword: user.mustChangePassword,
      status: user.status,
    };
    done(null as unknown as Error, payload);
  }

  async deserializeUser(
    payload: any,
    done: (err: Error, payload: any) => void,
  ): Promise<void> {
    const user = await this.usersService.findById(payload.id);
    done(null as unknown as Error, user);
  }
}
