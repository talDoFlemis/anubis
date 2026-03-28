import { PaginatedResult } from '../../../common/dto/paginated-response.dto';
import { Candidate } from '../../domain/candidate';
import { CandidateProfile } from '../../domain/candidate-profile';
import { FindCandidatesDto } from '../../dto/find-candidates.dto';

export abstract class CandidateRepository {
  abstract findByUserId(userId: string): Promise<Candidate | null>;

  abstract findProfileByUserId(
    userId: string,
  ): Promise<CandidateProfile | null>;

  abstract findAllByFilters(
    filters: FindCandidatesDto,
  ): Promise<PaginatedResult<CandidateProfile>>;

  abstract upsertByUserId(params: {
    userId: string;
    universityOfOrigin: string;
    ira?: string | null;
    poscomp?: number | null;
  }): Promise<Candidate>;
}
