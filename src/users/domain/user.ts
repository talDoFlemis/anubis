import { Exclude } from 'class-transformer';
import { AuthProvidersEnum } from '../../auth/auth-providers.enum';
import { RoleEnum } from '../../roles/roles.enum';
import { StatusEnum } from '../../statuses/statuses.enum';

export class User {
  id: string;
  email: string | null;
  @Exclude()
  password?: string | null;
  cpf: string | null;
  firstName: string | null;
  lastName: string | null;
  role: RoleEnum;
  status: StatusEnum;
  onboardingCompleted: boolean;
  mustChangePassword: boolean;
  bootstrapPasswordExpiresAt: Date | null;
  confirmEmailTokenVersion: number;
  forgotPasswordTokenVersion: number;
  linkedProviders: AuthProvidersEnum[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
