import { Injectable } from '@nestjs/common';
import { AuthProviderInterface } from 'src/auth/auth-provider.interface';

@Injectable()
export class AuthGithubService implements AuthProviderInterface {
  isValid(data: unknown): Promise<boolean> {
    void data;
    throw new Error('Method not implemented.');
  }
}
