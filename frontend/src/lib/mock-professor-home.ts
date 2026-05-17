export type ProfessorTheme = {
  id: string;
  name: string;
  researchLines: string[];
  updatedAt: string;
  slots: number;
  candidates: number;
};

export type ProfessorHomeMetrics = {
  publishedThemes: number;
  offeredSlots: number;
  enrolledCandidates: number;
};

type ProfessorHomeData = {
  metrics: ProfessorHomeMetrics;
  themes: ProfessorTheme[];
};

export const mockProfessorHome: ProfessorHomeData = {
  metrics: {
    publishedThemes: 4,
    offeredSlots: 8,
    enrolledCandidates: 24,
  },
  themes: [
    {
      id: 'sistemas-inteligentes-aplicados',
      name: 'Sistemas inteligentes aplicados a saude publica',
      researchLines: ['Sistemas inteligentes', 'Computacao aplicada', 'Ciencia de dados'],
      updatedAt: '2026-05-03',
      slots: 2,
      candidates: 9,
    },
    {
      id: 'arquiteturas-distribuidas',
      name: 'Arquiteturas distribuidas e sistemas resilientes',
      researchLines: ['Sistemas distribuidos', 'Engenharia de software'],
      updatedAt: '2026-04-21',
      slots: 3,
      candidates: 7,
    },
    {
      id: 'ml-educacao',
      name: 'Machine learning para acompanhamento educacional',
      researchLines: ['Aprendizado de maquina', 'Interacao humano computador', 'Analise de dados'],
      updatedAt: '2026-04-15',
      slots: 2,
      candidates: 5,
    },
    {
      id: 'seguranca-iot',
      name: 'Seguranca e privacidade em IoT urbana',
      researchLines: ['Seguranca da informacao', 'Redes e IoT'],
      updatedAt: '2026-03-28',
      slots: 1,
      candidates: 3,
    },
  ],
};
