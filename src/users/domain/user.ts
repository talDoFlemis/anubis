import { Exclude, plainToInstance } from 'class-transformer';
import { UserSelect } from 'src/database/schema/users';
import { AuthProvidersEnum } from '../../auth/auth-providers.enum';
import { RoleEnum } from '../../roles/roles.enum';
import { StatusEnum } from '../../statuses/statuses.enum';

export class User {
  id: string;
  authProvider: AuthProvidersEnum;
  providerSubject: string | null;
  email: string | null;
  @Exclude({ toPlainOnly: true })
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
  createdAt: Date;
  updatedAt: Date;

  static toDomain(userRow: UserSelect): User {
    return plainToInstance(User, {
      ...userRow,
      role: userRow.role as RoleEnum,
      status: userRow.status as StatusEnum,
      authProvider: userRow.authProvider as AuthProvidersEnum,
    });
  }
}
