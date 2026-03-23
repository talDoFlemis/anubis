import { Injectable } from '@nestjs/common';
import {
  AttachOwnedEmailData,
  CreateUserData,
  DetachOwnedEmailData,
  PromoteOwnedEmailData,
  UpdateUserData,
  UserOwnedEmail,
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
    socialId: string;
    provider: AuthProvidersEnum;
  }): Promise<User | null> {
    return this.userRepository.findByProviderAccount(params);
  }

  linkProviderAccount(params: {
    userId: string;
    provider: AuthProvidersEnum;
    socialId?: string | null;
  }): Promise<void> {
    return this.userRepository.linkProviderAccount(params);
  }

  hasProviderAccount(params: {
    userId: string;
    provider: AuthProvidersEnum;
  }): Promise<boolean> {
    return this.userRepository.hasProviderAccount(params);
  }

  listUserEmails(userId: string): Promise<UserOwnedEmail[]> {
    return this.userRepository.listUserEmails(userId);
  }

  attachOwnedEmail(data: AttachOwnedEmailData): Promise<UserOwnedEmail> {
    return this.userRepository.attachOwnedEmail(data);
  }

  detachOwnedEmail(data: DetachOwnedEmailData): Promise<void> {
    return this.userRepository.detachOwnedEmail(data);
  }

  promoteOwnedEmailToPrimary(
    params: PromoteOwnedEmailData,
  ): Promise<User | null> {
    return this.userRepository.promoteOwnedEmailToPrimary(params);
  }

  update(id: string, payload: UpdateUserData): Promise<User | null> {
    return this.userRepository.update(id, payload);
  }

  remove(id: string): Promise<void> {
    return this.userRepository.remove(id);
  }
}
