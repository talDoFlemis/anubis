import { Test, TestingModule } from '@nestjs/testing';
import { AuthGithubService } from './auth-github.service';

describe('AuthGithubService', () => {
  let service: AuthGithubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthGithubService],
    }).compile();

    service = module.get<AuthGithubService>(AuthGithubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
