import { User } from '../users/domain/user';
import { LoginResponseDto } from './dto/login-response.dto';

export function buildLoginResponse(user: User): LoginResponseDto {
  return {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    linkedProviders: user.linkedProviders,
    onboardingCompleted: user.onboardingCompleted,
    mustChangePassword: user.mustChangePassword,
  };
}
