import { User } from '../../domain/user';
import { AuthProvidersEnum } from '../../../auth/auth-providers.enum';

export type NullableUser = User | null;

export interface UserOwnedEmail {
  accountId: string | null;
  email: string;
  normalizedEmail: string | null;
  verifiedAt: Date | null;
  verificationTokenVersion: number | null;
  isPrimary: boolean;
}

export interface AttachOwnedEmailData {
  userId: User['id'];
  email: string;
  normalizedEmail: string;
  verificationTokenVersion?: number;
  verifiedAt?: Date | null;
}

export interface DetachOwnedEmailData {
  userId: User['id'];
  accountId: string;
}

export interface PromoteOwnedEmailData {
  userId: User['id'];
  accountId: string;
}

export interface CreateUserData {
  email: string | null;
  password?: string | null;
  cpf?: string | null;
  firstName: string | null;
  lastName: string | null;
  role: User['role'];
  status: User['status'];
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

  abstract findByProviderAccount(params: {
    providerId: string;
    provider: AuthProvidersEnum;
  }): Promise<NullableUser>;

  abstract linkProviderAccount(params: {
    userId: string;
    provider: AuthProvidersEnum;
    providerId?: string | null;
  }): Promise<void>;

  abstract hasProviderAccount(params: {
    userId: string;
    provider: AuthProvidersEnum;
  }): Promise<boolean>;

  abstract update(
    id: User['id'],
    payload: UpdateUserData,
  ): Promise<NullableUser>;

  abstract remove(id: User['id']): Promise<void>;
}
