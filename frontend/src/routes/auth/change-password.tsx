import {
  AuthCallout,
  AuthErrorMessage,
  AuthPageLayout,
  PasswordField,
  SubmitButton,
} from '@/components/auth';
import { Button } from '@/components/ui/button';
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '@/features/auth/auth-form.schemas';
import { useLogout, useUpdateProfile } from '@/hooks/use-auth';
import { getPostAuthPath } from '@/lib/auth-flow';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/change-password')({
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    } satisfies ChangePasswordFormData,
    validators: { onSubmit: changePasswordSchema },
    onSubmit: async ({ value }) => {
      updateProfile.mutate(
        {
          oldPassword: value.currentPassword,
          password: value.password,
        },
        {
          onSuccess: updatedUser => {
            navigate({ to: getPostAuthPath(updatedUser) });
          },
        },
      );
    },
  });

  return (
    <AuthPageLayout
      eyebrow="Atualizacao obrigatoria"
      title="Defina uma nova senha para continuar no ambiente do candidato."
      description="Seu acesso atual e temporario. Troque a senha agora para seguir com um credencial permanente e segura."
      compact
    >
      <form
        onSubmit={event => {
          event.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-5"
      >
        <form.Field name="currentPassword">
          {field => (
            <PasswordField
              id="currentPassword"
              label="Senha atual"
              value={field.state.value}
              onChange={value => field.handleChange(value)}
              onBlur={field.handleBlur}
              placeholder="Informe a senha temporaria"
              errors={field.state.meta.errors}
              isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            />
          )}
        </form.Field>

        <form.Field name="password">
          {field => (
            <PasswordField
              id="password"
              label="Nova senha"
              value={field.state.value}
              onChange={value => field.handleChange(value)}
              onBlur={field.handleBlur}
              placeholder="Minimo 8 caracteres"
              minLength={8}
              errors={field.state.meta.errors}
              isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            />
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {field => (
            <PasswordField
              id="confirmPassword"
              label="Confirmar nova senha"
              value={field.state.value}
              onChange={value => field.handleChange(value)}
              onBlur={field.handleBlur}
              placeholder="Repita a nova senha"
              minLength={8}
              errors={field.state.meta.errors}
              isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            />
          )}
        </form.Field>

        <AuthErrorMessage message={updateProfile.isError ? updateProfile.error.message : null} />

        <SubmitButton
          isPending={updateProfile.isPending}
          label="Salvar nova senha"
          pendingLabel="Salvando..."
        />
      </form>

      <AuthCallout
        title="Encerrar esta sessao"
        description="Se preferir reiniciar o processo com outra conta ou outra credencial, saia antes de concluir a troca."
      >
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          {logout.isPending ? 'Saindo...' : 'Sair desta conta'}
        </Button>
      </AuthCallout>
    </AuthPageLayout>
  );
}
