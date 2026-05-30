import { z } from 'zod';

export const researchThemeReferenceSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da referência.'),
  url: z.string().trim().url('Informe uma URL válida (ex: https://...).'),
});

export const researchThemeFormSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título do tema.'),
  description: z.string().trim().min(1, 'Informe a descrição do tema.'),
  vacancies: z.number().min(1, 'Vagas deve ser no mínimo 1.'),
  level: z.enum(['masters', 'doctoral'], {
    message: 'Selecione o nível do tema.',
  }),
  references: z.array(researchThemeReferenceSchema),
  associatedProfessorIds: z.array(z.string()),
  professorId: z.string().trim().optional(), // only required on-behalf when creating
});

export type ResearchThemeFormData = z.infer<typeof researchThemeFormSchema>;

export const INITIAL_RESEARCH_THEME_FORM: ResearchThemeFormData = {
  title: '',
  description: '',
  vacancies: 1,
  level: 'masters',
  references: [],
  associatedProfessorIds: [],
  professorId: '',
};
