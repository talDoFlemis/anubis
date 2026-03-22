import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UsersService } from '../users/users.service';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { CompleteCandidateOnboardingDto } from './dto/complete-candidate-onboarding.dto';
import { CandidateRepository } from './infrastructure/persistence/candidate.repository';

@Injectable()
export class CandidateService {
  constructor(
    private readonly usersService: UsersService,
    private readonly candidateRepository: CandidateRepository,
    @InjectPinoLogger(CandidateService.name)
    private readonly logger: PinoLogger,
  ) {}

  async createProfile(params: {
    userId: string;
    universityOfOrigin: string;
    ira?: string | null;
    poscomp?: number | null;
  }): Promise<void> {
    this.logger.debug({ userId: params.userId }, 'Upserting candidate profile');

    try {
      await this.candidateRepository.upsertByUserId(params);
      this.logger.info(
        { userId: params.userId },
        'Candidate profile created or updated',
      );
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          userId: params.userId,
        },
        'Failed to upsert candidate profile',
      );
      throw error;
    }
  }

  async completeOnboarding(
    userId: string,
    dto: CompleteCandidateOnboardingDto,
  ): Promise<void> {
    this.logger.debug({ userId }, 'Candidate onboarding completion requested');

    try {
      const user = await this.usersService.findById(userId);

      if (!user) {
        throw new NotFoundException('Usuario nao encontrado.');
      }

      if (user.role !== RoleEnum.candidate) {
        throw new BadRequestException(
          'Apenas candidatos podem concluir onboarding de candidato.',
        );
      }

      const existingCpf = await this.usersService.findByCpf(dto.cpf);
      if (existingCpf && existingCpf.id !== user.id) {
        throw new ConflictException('Este CPF ja esta cadastrado.');
      }

      await this.usersService.update(user.id, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        cpf: dto.cpf,
        onboardingCompleted: true,
        status: StatusEnum.active,
      });

      await this.candidateRepository.upsertByUserId({
        userId: user.id,
        universityOfOrigin: dto.universityOfOrigin,
        ira: dto.ira ?? null,
        poscomp: dto.poscomp ?? null,
      });

      this.logger.info({ userId }, 'Candidate onboarding completed');
    } catch (error: unknown) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
        },
        'Candidate onboarding completion failed',
      );
      throw error;
    }
  }

  findByUserId(userId: string) {
    this.logger.debug({ userId }, 'Fetching candidate profile');
    return this.candidateRepository.findByUserId(userId);
  }
}
