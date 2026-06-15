export type CapesClassification = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7' | 'A8' | 'none';

export interface QualisPointsConfig {
  classifications: Record<CapesClassification, number>;
  bonuses: {
    completeArticle: number;
    summaryPoster: number;
    periodical: number;
    mainAuthor: number;
    dissertationOutcome: number;
    encontroIc: number;
  };
}

export const QUALIS_POINTS: QualisPointsConfig = {
  classifications: {
    A1: 0.6,
    A2: 0.6,
    A3: 0.6,
    A4: 0.6,
    A5: 0.4,
    A6: 0.4,
    A7: 0.2,
    A8: 0.2,
    none: 0.1,
  },
  bonuses: {
    completeArticle: 0.2,
    summaryPoster: 0.1,
    periodical: 0.2,
    mainAuthor: 0.2,
    dissertationOutcome: 0.1,
    encontroIc: 0.1,
  },
};

export interface SectionConfig {
  key: string;
  name: string;
  description: string;
  maxPoints: number;
  type: 'semestral' | 'punctual';
  sortOrder: number;
}

export const MASTERS_SECTIONS: Record<string, SectionConfig> = {
  PROJECTS: {
    key: 'PROJECTS',
    name: 'Participação em projetos de pesquisa e iniciação científica',
    description:
      '0.3 por semestre + 0.2 adicional se na área de pesquisa da candidatura (1ª opção). Máximo de 2,0 pontos.',
    maxPoints: 2.0,
    type: 'semestral',
    sortOrder: 1,
  },
  PRODUCTION: {
    key: 'PRODUCTION',
    name: 'Produção científica',
    description:
      'Artigos e publicações baseados no estrato Qualis + bônus cumulativos. Máximo de 1,0 ponto.',
    maxPoints: 1.0,
    type: 'punctual',
    sortOrder: 2,
  },
  TEACHING: {
    key: 'TEACHING',
    name: 'Atividade de docência ou iniciação à docência',
    description:
      '0.2 por semestre de iniciação à docência (monitoria) ou 0.3 por semestre como docente em IES. Máximo de 0,5 pontos.',
    maxPoints: 0.5,
    type: 'semestral',
    sortOrder: 3,
  },
  EVENTS: {
    key: 'EVENTS',
    name: 'Apresentação de trabalhos em eventos científicos',
    description:
      'Apresentação de trabalhos (excluídos encontros de IC). Escopo Local: 0.1; Nacional: 0.2; Internacional: 0.3. Máximo de 0,5 pontos.',
    maxPoints: 0.5,
    type: 'punctual',
    sortOrder: 4,
  },
};

export const DOCTORAL_SECTIONS: Record<string, SectionConfig> = {
  PROJECTS: {
    key: 'PROJECTS',
    name: 'Participação em projetos de pesquisa',
    description:
      '0.2 por semestre + 0.1 adicional se na área de pesquisa da candidatura. Máximo de 1,0 ponto.',
    maxPoints: 1.0,
    type: 'semestral',
    sortOrder: 1,
  },
  PRODUCTION: {
    key: 'PRODUCTION',
    name: 'Produção científica (exceto publicações em encontros de iniciação científica)',
    description:
      'Artigos e publicações baseados no estrato Qualis + bônus cumulativos. Máximo de 1,5 pontos.',
    maxPoints: 1.5,
    type: 'punctual',
    sortOrder: 2,
  },
  ORIENTATION: {
    key: 'ORIENTATION',
    name: 'Orientação de iniciação científica',
    description: '0.2 pontos por semestre e por aluno orientado. Máximo de 0,5 pontos.',
    maxPoints: 0.5,
    type: 'semestral',
    sortOrder: 3,
  },
  TEACHING: {
    key: 'TEACHING',
    name: 'Experiência como docente',
    description: '0.2 por semestre como docente. Máximo de 0,5 pontos.',
    maxPoints: 0.5,
    type: 'semestral',
    sortOrder: 4,
  },
  EVENTS: {
    key: 'EVENTS',
    name: 'Apresentação de trabalhos em eventos científicos (excluídos encontros de IC)',
    description:
      'Apresentação de trabalhos. Escopo Local: 0.1; Nacional: 0.2; Internacional: 0.3. Máximo de 0,5 pontos.',
    maxPoints: 0.5,
    type: 'punctual',
    sortOrder: 5,
  },
};

export const EVENT_POINTS = {
  local: 0.1,
  nacional: 0.2,
  internacional: 0.3,
};
