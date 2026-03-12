import { User } from '../../domain/user';

export type NullableUser = User | null;

export abstract class UserRepository {
  abstract create(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<User>;

  abstract findById(id: User['id']): Promise<NullableUser>;

  abstract findByEmail(email: string): Promise<NullableUser>;

  abstract findBySocialIdAndProvider(params: {
    socialId: string;
    provider: string;
  }): Promise<NullableUser>;

  abstract update(
    id: User['id'],
    payload: Partial<Omit<User, 'id' | 'createdAt' | 'deletedAt'>>,
  ): Promise<NullableUser>;

  abstract remove(id: User['id']): Promise<void>;
}
