import { Injectable } from '@nestjs/common';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { User } from './domain/user';
import {
  CreateUserData,
  UpdateUserData,
  UserRepository,
} from './infrastructure/persistence/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  create(data: CreateUserData): Promise<User> {
    return this.userRepository.create(data);
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  findByCpf(cpf: string): Promise<User | null> {
    return this.userRepository.findByCpf(cpf);
  }

  findByAuthProvider(params: {
    provider: AuthProvidersEnum;
    providerSubject: string;
  }): Promise<User | null> {
    return this.userRepository.findByAuthProvider(params);
  }

  update(id: string, payload: UpdateUserData): Promise<User | null> {
    return this.userRepository.update(id, payload);
  }

  remove(id: string): Promise<void> {
    return this.userRepository.remove(id);
  }
}
