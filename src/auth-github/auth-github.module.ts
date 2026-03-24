import { Module } from '@nestjs/common';
import { AuthGithubService } from './auth-github.service';

@Module({
  providers: [AuthGithubService]
})
export class AuthGithubModule {}
