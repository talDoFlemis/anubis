export interface ProjectEvaluation {
  id: string;
  candidateId: string;
  evaluatorId: string;
  criterion1: 4 | 6 | 8 | 10;
  criterion2: 4 | 6 | 8 | 10;
  criterion3: 4 | 6 | 8 | 10;
  criterion4: 4 | 6 | 8 | 10;
  criterion5: 4 | 6 | 8 | 10;
  observations?: string | null;
  createdAt: Date;
}
