import { Injectable } from '@nestjs/common';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { User } from './domain/user';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  create(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<User> {
    return this.userRepository.create(data);
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  findBySocialIdAndProvider(params: {
    socialId: string;
    provider: string;
  }): Promise<User | null> {
    return this.userRepository.findBySocialIdAndProvider(params);
  }

  update(
    id: string,
    payload: Partial<Omit<User, 'id' | 'createdAt' | 'deletedAt'>>,
  ): Promise<User | null> {
    return this.userRepository.update(id, payload);
  }

  remove(id: string): Promise<void> {
    return this.userRepository.remove(id);
  }
}
