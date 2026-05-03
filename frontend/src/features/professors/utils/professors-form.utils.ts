import type { Professor } from '@/lib/mock-professors-management';
import type { NewProfessorFormData } from '../types/professors-form.types';

export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '');
}

export function createProfessorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `doc-${Date.now()}`;
}

export function filterProfessors(professors: Professor[], query: string): Professor[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return professors;

  return professors.filter(
    professor =>
      professor.nome.toLowerCase().includes(normalizedQuery) ||
      professor.email.toLowerCase().includes(normalizedQuery),
  );
}

export function toggleProfessorStatus(professors: Professor[], professorId: string): Professor[] {
  return professors.map(professor => {
    if (professor.id !== professorId) return professor;
    return {
      ...professor,
      status: professor.status === 'Desativado' ? 'Verificado' : 'Desativado',
    };
  });
}

export function mapFormToProfessor(formData: NewProfessorFormData): Professor {
  return {
    id: createProfessorId(),
    nome: formData.fullName.trim(),
    cpf: normalizeCpf(formData.cpf),
    matriculaDocente: formData.professorId.trim(),
    tipo: 'DOCENTE PERMANENTE',
    email: formData.email.trim().toLowerCase(),
    instituicaoOrigem: formData.originInstitution.trim(),
    linhaPesquisaPrincipal: formData.mainResearchLine,
    status: 'Pendente',
  };
}
