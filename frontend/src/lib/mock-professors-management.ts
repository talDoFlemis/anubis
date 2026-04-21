export type StatusDocente = 'Verificado' | 'Pendente' | 'Desativado';

export interface Docente {
  id: string;
  nome: string;
  tipo: string;
  email: string;
  status: StatusDocente;
  avatarUrl?: string;
}

export const mockDocentes: Docente[] = [
  {
    id: '1',
    nome: 'Dr. Ricardo Almeida',
    tipo: 'DOCENTE PERMANENTE',
    email: 'r.almeida@ufc.br',
    status: 'Verificado',
  },
  {
    id: '2',
    nome: 'Dra. Ana Souza',
    tipo: 'COLABORADORA',
    email: 'ana.souza@mdcc.ufc.br',
    status: 'Pendente',
  },
  {
    id: '3',
    nome: 'Dr. Carlos Mendes',
    tipo: 'DOCENTE PERMANENTE',
    email: 'c.mendes@ufc.br',
    status: 'Verificado',
  },
  {
    id: '4',
    nome: 'Dr. João Silveira',
    tipo: 'DOCENTE CONVIDADO',
    email: 'j.silveira@ufc.br',
    status: 'Desativado',
  },
];
