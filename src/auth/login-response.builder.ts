import type { User } from '../users/domain/user';
import type { LoginResponseDto } from '../auth-email/dto/login-response.dto';

export function buildLoginResponse(user: User): LoginResponseDto {
  return {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    onboardingCompleted: user.onboardingCompleted,
    mustChangePassword: user.mustChangePassword,
  };
}
