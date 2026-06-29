export interface InterviewEvaluation {
  id: string;
  candidateId: string;
  evaluatorId: string;
  decisionMaking: 4 | 6 | 8 | 10;
  problemAnalysis: 4 | 6 | 8 | 10;
  oralCommunication: 4 | 6 | 8 | 10;
  researchWork: 4 | 6 | 8 | 10;
  technicalKnowledge: 4 | 6 | 8 | 10;
  observations?: string | null;
  createdAt: Date;
}
