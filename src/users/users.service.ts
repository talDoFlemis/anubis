import { Injectable } from '@nestjs/common';
import {
  CreateUserData,
  UpdateUserData,
  UserRepository,
} from './infrastructure/persistence/user.repository';
import { User } from './domain/user';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';

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

  findByProviderAccount(params: {
    providerId: string;
    provider: AuthProvidersEnum;
  }): Promise<User | null> {
    return this.userRepository.findByProviderAccount(params);
  }

  linkProviderAccount(params: {
    userId: string;
    provider: AuthProvidersEnum;
    providerId?: string | null;
  }): Promise<void> {
    return this.userRepository.linkProviderAccount(params);
  }

  hasProviderAccount(params: {
    userId: string;
    provider: AuthProvidersEnum;
  }): Promise<boolean> {
    return this.userRepository.hasProviderAccount(params);
  }

  update(id: string, payload: UpdateUserData): Promise<User | null> {
    return this.userRepository.update(id, payload);
  }

  remove(id: string): Promise<void> {
    return this.userRepository.remove(id);
  }
}
