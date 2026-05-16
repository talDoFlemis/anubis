import { AuthErrorMessage, AuthPageLayout, EmailField, SubmitButton } from '@/components/auth';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/features/auth/auth-form.schemas';
import { useForgotPassword } from '@/hooks/use-auth';
import { AUTH_HOME_ROUTE } from '@/lib/auth-flow';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, Link } from '@tanstack/react-router';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const form = useForm({
    defaultValues: { email: '' } satisfies ForgotPasswordFormData,
    validators: { onSubmit: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      forgotPassword.mutate(value, {
        onSuccess: () => {
          toast.success('Email enviado! Verifique sua caixa de entrada para redefinir a senha.');
        },
      });
    },
  });

  return (
    <AuthPageLayout
      eyebrow="Recuperacao"
      title="Peça um novo acesso sem perder o ritmo da candidatura."
      description="Informe o email da conta para receber o link de redefinicao e retomar sua entrada com seguranca."
      compact
      footer={
        <Link to={AUTH_HOME_ROUTE} className="text-primary underline-offset-4 hover:underline">
          Voltar para o login
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
        <form.Field name="email">
          {field => (
            <EmailField
              value={field.state.value}
              onChange={value => field.handleChange(value)}
              onBlur={field.handleBlur}
              errors={field.state.meta.errors}
              isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            />
          )}
        </form.Field>

        <AuthErrorMessage message={forgotPassword.isError ? forgotPassword.error.message : null} />

        <SubmitButton
          isPending={forgotPassword.isPending}
          label="Enviar link de recuperacao"
          pendingLabel="Enviando..."
        />
      </form>
    </AuthPageLayout>
  );
}
