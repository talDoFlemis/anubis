// src/lib/mock-validation-data.ts
import type { CandidateValidationSummary } from '@/lib/api/validation';

export const mockValidationCandidates: CandidateValidationSummary[] = [
  {
    enrollmentId: 'enr-001',
    candidateName: 'Antônio Gabriel',
    candidateEmail: 'agabriel@email.com',
    themeName: 'Observabilidade em Engenharia de Software',
    professorName: 'Dr. Lincoln',
    level: 'Mestrado',
    declaredScore: 45.5,
    validatedScore: null,
    status: 'pending',
    submittedAt: '2026-06-10T14:00:00Z',
  },
  {
    enrollmentId: 'enr-002',
    candidateName: 'Said Costa',
    candidateEmail: 'said.costa@email.com',
    themeName: 'Machine Learning Aplicado',
    professorName: 'Dra. Mariana',
    level: 'Doutorado',
    declaredScore: 62.0,
    validatedScore: 40.5,
    status: 'in_progress',
    submittedAt: '2026-06-11T09:30:00Z',
  },
  {
    enrollmentId: 'enr-003',
    candidateName: 'Laura Silva',
    candidateEmail: 'laura.s@email.com',
    themeName: 'Otimização de Redes',
    professorName: 'Dr. Lincoln',
    level: 'Mestrado',
    declaredScore: 30.0,
    validatedScore: 30.0,
    status: 'completed',
    submittedAt: '2026-06-12T10:15:00Z',
  },
];
