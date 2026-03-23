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

  listUserEmails(userId: User['id']): Promise<UserOwnedEmail[]> {
    throw new Error(
      'listUserEmails must be implemented by a concrete repository',
    );
  }

  attachOwnedEmail(data: AttachOwnedEmailData): Promise<UserOwnedEmail> {
    throw new Error(
      'attachOwnedEmail must be implemented by a concrete repository',
    );
  }

  detachOwnedEmail(data: DetachOwnedEmailData): Promise<void> {
    throw new Error(
      'detachOwnedEmail must be implemented by a concrete repository',
    );
  }

  promoteOwnedEmailToPrimary(
    params: PromoteOwnedEmailData,
  ): Promise<NullableUser> {
    throw new Error(
      'promoteOwnedEmailToPrimary must be implemented by a concrete repository',
    );
  }

  abstract findByCpf(cpf: string): Promise<NullableUser>;

  abstract findByProviderAccount(params: {
    socialId: string;
    provider: AuthProvidersEnum;
  }): Promise<NullableUser>;

  abstract linkProviderAccount(params: {
    userId: string;
    provider: AuthProvidersEnum;
    socialId?: string | null;
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
