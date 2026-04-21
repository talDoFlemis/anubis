export type StatusDocente = 'Verificado' | 'Pendente' | 'Desativado';

export interface Docente {
  id: string;
  nome: string;
  cpf: string;
  matriculaDocente: string;
  tipo: string;
  email: string;
  instituicaoOrigem: string;
  linhaPesquisaPrincipal: string;
  status: StatusDocente;
  avatarUrl?: string;
}

export const linhasPesquisaPrincipais = [
  'Inteligencia Artificial',
  'Sistemas Distribuidos',
  'Engenharia de Software',
  'Banco de Dados',
  'Computacao Grafica',
  'Redes de Computadores',
  'Seguranca da Informacao',
] as const;

export const mockDocentes: Docente[] = [
  {
    id: '1',
    nome: 'Dr. Ricardo Almeida',
    cpf: '12345678909',
    matriculaDocente: 'DOC-0001',
    tipo: 'DOCENTE PERMANENTE',
    email: 'r.almeida@ufc.br',
    instituicaoOrigem: 'UFC',
    linhaPesquisaPrincipal: 'Inteligencia Artificial',
    status: 'Verificado',
  },
  {
    id: '2',
    nome: 'Dra. Ana Souza',
    cpf: '39053344705',
    matriculaDocente: 'DOC-0002',
    tipo: 'COLABORADORA',
    email: 'ana.souza@mdcc.ufc.br',
    instituicaoOrigem: 'UFC',
    linhaPesquisaPrincipal: 'Engenharia de Software',
    status: 'Pendente',
  },
  {
    id: '3',
    nome: 'Dr. Carlos Mendes',
    cpf: '11144477735',
    matriculaDocente: 'DOC-0003',
    tipo: 'DOCENTE PERMANENTE',
    email: 'c.mendes@ufc.br',
    instituicaoOrigem: 'UFC',
    linhaPesquisaPrincipal: 'Sistemas Distribuidos',
    status: 'Verificado',
  },
  {
    id: '4',
    nome: 'Dr. João Silveira',
    cpf: '98765432100',
    matriculaDocente: 'DOC-0004',
    tipo: 'DOCENTE CONVIDADO',
    email: 'j.silveira@ufc.br',
    instituicaoOrigem: 'UFC',
    linhaPesquisaPrincipal: 'Redes de Computadores',
    status: 'Desativado',
  },
];
