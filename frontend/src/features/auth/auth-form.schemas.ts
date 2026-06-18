import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail.').email('E-mail invalido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

export const signUpSchema = z.object({
  firstName: z.string().trim().min(1, 'Informe o nome.'),
  lastName: z.string().trim().min(1, 'Informe o sobrenome.'),
  cpf: z.string().trim().min(1, 'Informe o CPF.'),
  email: z.string().trim().min(1, 'Informe o e-mail.').email('E-mail invalido.'),
  password: z.string().min(6, 'A senha deve ter no minimo 6 caracteres.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail.').email('E-mail invalido.'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    password: z.string().min(8, 'A nova senha deve ter no minimo 8 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine(values => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas nao coincidem.',
  });

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'A nova senha deve ter no minimo 8 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine(values => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas nao coincidem.',
  });

export const professorOnboardingSchema = resetPasswordSchema;

export const onboardingSchema = z.object({
  firstName: z.string().trim().min(1, 'Informe o nome.'),
  lastName: z.string().trim().min(1, 'Informe o sobrenome.'),
  cpf: z.string().trim().min(1, 'Informe o CPF.'),
  universityOfOrigin: z.string().trim().min(1, 'Informe a universidade de origem.'),
  ira: z.string().trim().min(1, 'Informe o IRA.'),
  poscomp: z.string().trim(),
});

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfessorOnboardingFormData = z.infer<typeof professorOnboardingSchema>;
export type OnboardingFormData = z.infer<typeof onboardingSchema>;
