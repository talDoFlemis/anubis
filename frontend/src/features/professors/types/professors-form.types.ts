import { z } from 'zod';

export const newProfessorFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Informe o nome completo.'),
  cpf: z
    .string()
    .trim()
    .min(1, 'Informe o CPF.')
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 11, 'CPF deve conter 11 números.'),
  professorId: z.string().trim().min(1, 'Informe a matricula do docente.'),
  email: z.email('E-mail invalido.').trim().min(1, 'Informe o e-mail.'),
  originInstitution: z.string().trim().min(1, 'Informe a instituicao de origem.'),
  mainResearchLine: z.string().trim().min(1, 'Selecione a linha de pesquisa principal.'),
});

export type NewProfessorFormData = z.infer<typeof newProfessorFormSchema>;

export const INITIAL_NEW_PROFESSOR_FORM: NewProfessorFormData = {
  fullName: '',
  cpf: '',
  professorId: '',
  email: '',
  originInstitution: '',
  mainResearchLine: '',
};
