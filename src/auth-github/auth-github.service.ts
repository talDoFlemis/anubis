import { Injectable } from '@nestjs/common';
import { AuthProviderInterface } from 'src/auth/auth-provider.interface';

@Injectable()
export class AuthGithubService implements AuthProviderInterface {
  isValid(data: any): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
