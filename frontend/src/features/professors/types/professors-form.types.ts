export interface NovoDocenteFormData {
  nomeCompleto: string;
  cpf: string;
  matriculaDocente: string;
  email: string;
  instituicaoOrigem: string;
  linhaPesquisaPrincipal: string;
}

export interface NovoDocenteFormErrors {
  nomeCompleto?: string;
  cpf?: string;
  matriculaDocente?: string;
  email?: string;
  instituicaoOrigem?: string;
  linhaPesquisaPrincipal?: string;
}

export const INITIAL_NOVO_DOCENTE_FORM: NovoDocenteFormData = {
  nomeCompleto: '',
  cpf: '',
  matriculaDocente: '',
  email: '',
  instituicaoOrigem: '',
  linhaPesquisaPrincipal: '',
};
