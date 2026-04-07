export interface CandidateTimelineItem {
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming';
}

export interface CandidateNotice {
  title: string;
  description: string;
  tag: string;
}

export interface CandidateTask {
  title: string;
  due: string;
  emphasis: string;
}

export const mockCandidateHome = {
  cycleName: 'Selecao Anual MDCC-UFC 2026',
  profile: {
    universityOfOrigin: 'Universidade Federal do Ceara',
    ira: '8.74',
    poscomp: '780',
  },
  summary: {
    statusLabel: 'Inscricao em preparo',
    progressLabel: '3 de 5 frentes organizadas',
    nextMilestone: 'Envio final de documentacao ate 12/04',
  },
  notices: [
    {
      title: 'Janela de submissao documental aberta',
      description:
        'A organizacao da documentacao ja pode ser iniciada com antecedencia para evitar ajustes perto do prazo final.',
      tag: 'Prioridade atual',
    },
    {
      title: 'Resultado preliminar do enquadramento em 18/04',
      description:
        'Acompanhe a publicacao e deixe seus comprovantes principais revisados antes da divulgacao.',
      tag: 'Calendario',
    },
  ] satisfies CandidateNotice[],
  tasks: [
    {
      title: 'Revisar historico escolar e diploma',
      due: 'Hoje',
      emphasis: 'Documentacao base',
    },
    {
      title: 'Conferir cartas e anexos complementares',
      due: 'Ate 09/04',
      emphasis: 'Conferencia final',
    },
    {
      title: 'Enviar documentacao consolidada',
      due: 'Ate 12/04',
      emphasis: 'Acao primaria',
    },
  ] satisfies CandidateTask[],
  timeline: [
    {
      title: 'Conta criada e acesso confirmado',
      description: 'Cadastro inicial validado e ambiente liberado para acompanhamento das etapas.',
      date: 'Concluido',
      status: 'completed',
    },
    {
      title: 'Curadoria de documentos',
      description:
        'Momento ideal para revisar anexos, nomes de arquivos e coerencia do conjunto enviado.',
      date: 'Em andamento',
      status: 'current',
    },
    {
      title: 'Submissao definitiva',
      description:
        'Encerramento da inscricao com protocolo e consolidacao dos materiais obrigatorios.',
      date: 'Ate 12/04',
      status: 'upcoming',
    },
  ] satisfies CandidateTimelineItem[],
};
