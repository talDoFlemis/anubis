import type { Classification } from '@/lib/api/classification';

export const mockClassificationData: Classification[] = [
  {
    id: '1',
    candidateId: 'candidato-1',
    researchThemeId: 'inteligencia-artificial',
    ira: '8.5',
    cvScore: '7.5',
    interviewScore: '9.0',
    projectScore: '8.0',
    finalScore: '8.3',
    rank: 1,
    stage: 'doutorado',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    candidateId: 'candidato-2',
    researchThemeId: 'inteligencia-artificial',
    ira: '7.2',
    cvScore: '8.0',
    interviewScore: '7.5',
    projectScore: '7.0',
    finalScore: '7.5',
    rank: 2,
    stage: 'doutorado',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
