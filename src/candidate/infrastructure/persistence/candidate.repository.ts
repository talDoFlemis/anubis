import type { PaginatedResult } from '../../../common/dto/paginated-response.dto';
import type { Candidate } from '../../domain/candidate';
import type { CandidateProfile } from '../../domain/candidate-profile';
import type { FindCandidatesDto } from '../../dto/find-candidates.dto';

export abstract class CandidateRepository {
  abstract findByUserId(userId: string): Promise<Candidate | null>;

  abstract findProfileByUserId(userId: string): Promise<CandidateProfile | null>;

  abstract findAllByFilters(filters: FindCandidatesDto): Promise<PaginatedResult<CandidateProfile>>;

  abstract upsertByUserId(params: {
    userId: string;
    universityOfOrigin: string;
    ira: string;
    poscomp?: number | null;
  }): Promise<Candidate>;
}
