import {
  AuthCallout,
  AuthErrorMessage,
  AuthPageLayout,
  PasswordField,
  SubmitButton,
} from '@/components/auth';
import { Button } from '@/components/ui/button';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/features/auth/auth-form.schemas';
import { useResetPassword } from '@/hooks/use-auth';
import { AUTH_SIGN_IN_ROUTE, validateHashSearch } from '@/lib/auth-flow';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { KeyRound, XCircle } from 'lucide-react';

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: validateHashSearch,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { hash } = Route.useSearch();
  const resetPassword = useResetPassword();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { password: '', confirmPassword: '' } satisfies ResetPasswordFormData,
    validators: { onSubmit: resetPasswordSchema },
    onSubmit: async ({ value }) => {
      resetPassword.mutate(
        { hash, password: value.password },
        {
          onSuccess: () => {
            navigate({ to: AUTH_SIGN_IN_ROUTE });
          },
        },
      );
    },
  });

  if (!hash) {
    return (
      <AuthPageLayout
        eyebrow="Link invalido"
        title="Este acesso de recuperacao nao esta mais disponivel."
        description="O link pode ter expirado ou ter sido aberto de forma incompleta. Solicite uma nova recuperacao para continuar."
        compact
        status={
          <AuthCallout
            title="Nao foi possivel validar o link"
            description="Solicite um novo envio e retome o fluxo a partir do email cadastrado."
            className="bg-[rgba(186,26,26,0.08)]"
          >
            <XCircle className="text-destructive h-5 w-5" />
          </AuthCallout>
        }
        footer={
          <Button variant="outline" onClick={() => navigate({ to: AUTH_SIGN_IN_ROUTE })}>
            Ir para o login
          </Button>
        }
      >
        <div />
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      eyebrow="Nova senha"
      title="Defina uma nova senha para retomar seu acesso."
      description="Escolha uma senha nova e confirme abaixo. Assim que o envio for concluido, voce podera entrar novamente no Anubis."
      compact
      status={
        <AuthCallout
          title="Link de recuperacao validado"
          description="Agora falta apenas registrar a nova senha para voltar ao fluxo normal de acesso."
        >
          <KeyRound className="text-primary h-5 w-5" />
        </AuthCallout>
      }
      footer={
        <Link to={AUTH_SIGN_IN_ROUTE} className="text-primary underline-offset-4 hover:underline">
          Cancelar e voltar ao login
        </Link>
      }
    >
      <form
        onSubmit={event => {
          event.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-5"
      >
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
              label="Confirmar senha"
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

        <AuthErrorMessage message={resetPassword.isError ? resetPassword.error.message : null} />

        <SubmitButton
          isPending={resetPassword.isPending}
          label="Redefinir senha"
          pendingLabel="Redefinindo..."
        />
      </form>
    </AuthPageLayout>
  );
}
