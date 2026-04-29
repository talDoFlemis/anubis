import type { NovoDocenteFormData, NovoDocenteFormErrors } from '../types/professors-form.types';

export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '');
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);
  return /^\d{11}$/.test(cpf);
}

export function createDocenteId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `doc-${Date.now()}`;
}

export function validateNovoDocenteForm(formData: NovoDocenteFormData): NovoDocenteFormErrors {
  const errors: NovoDocenteFormErrors = {};

  if (!formData.nomeCompleto.trim()) {
    errors.nomeCompleto = 'Informe o nome completo.';
  }

  if (!formData.cpf.trim()) {
    errors.cpf = 'Informe o CPF.';
  } else if (!isValidCpf(formData.cpf)) {
    errors.cpf = 'CPF deve conter 11 numeros.';
  }

  if (!formData.matriculaDocente.trim()) {
    errors.matriculaDocente = 'Informe a matricula do docente.';
  }

  if (!formData.email.trim()) {
    errors.email = 'Informe o e-mail.';
  } else if (!isValidEmail(formData.email.trim())) {
    errors.email = 'E-mail invalido.';
  }

  if (!formData.instituicaoOrigem.trim()) {
    errors.instituicaoOrigem = 'Informe a instituicao de origem.';
  }

  if (!formData.linhaPesquisaPrincipal.trim()) {
    errors.linhaPesquisaPrincipal = 'Selecione a linha de pesquisa principal.';
  }

  return errors;
}
