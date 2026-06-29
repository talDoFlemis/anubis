export interface Classification {
  id: string;
  candidateId: string;
  researchThemeId: string | null;
  interviewScore: number;
  cvScore: number;
  projectScore: number | null;
  finalScore: number;
  rank: number;
  stage: 'mestrado' | 'doutorado';
  createdAt: Date;
}

export interface ClassificationInsert {
  candidateId: string;
  researchThemeId: string | null;
  interviewScore: number;
  cvScore: number;
  projectScore: number | null;
  finalScore: number;
  rank: number;
  stage: 'mestrado' | 'doutorado';
}
