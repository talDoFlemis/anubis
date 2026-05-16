import type { AuthProvidersEnum } from '../../../auth/auth-providers.enum';
import type { User } from '../../domain/user';

export type NullableUser = User | null;

export interface CreateUserData {
  email: string | null;
  password?: string | null;
  cpf?: string | null;
  firstName: string | null;
  lastName: string | null;
  role: User['role'];
  status: User['status'];
  authProvider: AuthProvidersEnum;
  providerSubject: string | null;
  onboardingCompleted?: boolean;
  mustChangePassword?: boolean;
  bootstrapPasswordExpiresAt?: Date | null;
  confirmEmailTokenVersion?: number;
  forgotPasswordTokenVersion?: number;
}

export interface UpdateUserData {
  email?: string | null;
  password?: string | null;
  cpf?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: User['role'];
  status?: User['status'];
  authProvider?: AuthProvidersEnum;
  providerSubject?: string | null;
  onboardingCompleted?: boolean;
  mustChangePassword?: boolean;
  bootstrapPasswordExpiresAt?: Date | null;
  confirmEmailTokenVersion?: number;
  forgotPasswordTokenVersion?: number;
}

export abstract class UserRepository {
  abstract create(data: CreateUserData): Promise<User>;

  abstract findById(id: User['id']): Promise<NullableUser>;

  abstract findByEmail(email: string): Promise<NullableUser>;

  abstract findByCpf(cpf: string): Promise<NullableUser>;

  abstract findByAuthProvider(params: {
    provider: AuthProvidersEnum;
    providerSubject: string;
  }): Promise<NullableUser>;

  abstract update(id: User['id'], payload: UpdateUserData): Promise<NullableUser>;

  abstract remove(id: User['id']): Promise<void>;
}
