import { Candidate } from '../../domain/candidate';

export abstract class CandidateRepository {
  abstract findByUserId(userId: string): Promise<Candidate | null>;

  abstract upsertByUserId(params: {
    userId: string;
    universityOfOrigin: string;
    ira?: string | null;
    poscomp?: number | null;
  }): Promise<Candidate>;
}
