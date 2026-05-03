import { createFileRoute, Link } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import {
  AuthCallout,
  AuthErrorMessage,
  AuthPageLayout,
  EmailField,
  OAuthDivider,
  PasswordField,
  SubmitButton,
} from '@/components/auth';
import { GoogleLoginButton } from '@/components/google-login-button';
import { useEmailLogin } from '@/hooks/use-auth';
import { AUTH_SIGN_UP_ROUTE } from '@/lib/auth-flow';
import { signInSchema, type SignInFormData } from '@/features/auth/auth-form.schemas';

export const Route = createFileRoute('/auth/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  const emailLogin = useEmailLogin();
  const form = useForm({
    defaultValues: { email: '', password: '' } satisfies SignInFormData,
    validators: { onSubmit: signInSchema },
    onSubmit: async ({ value }) => {
      emailLogin.mutate(value);
    },
  });

  return (
    <AuthPageLayout
      eyebrow="Acesso"
      title="Entre para acompanhar sua jornada seletiva."
      description="Consulte documentos, acompanhe prazos e retome seu processo com a mesma clareza editorial presente em cada etapa do Anubis."
      asideTitle="Cada candidatura, documento e prazo em um unico fluxo de leitura."
      asideDescription="O ambiente de acesso organiza o essencial: continuidade do processo, recuperacao de senha e autenticacao institucional sem ruido visual."
      metrics={[
        { label: 'Ambiente', value: 'MDCC/UFC' },
        { label: 'Curadoria', value: '1 fluxo' },
        { label: 'Entrada', value: 'Google + email' },
      ]}
      notes={[
        'Use seu email e senha quando ja tiver configurado o acesso institucional ou continue com Google para entrar com a conta vinculada.',
        'Se este for seu primeiro acesso com Google, voce pode ser conduzido para concluir o cadastro antes de chegar a area inicial.',
      ]}
      footer={
        <>
          Candidatos ainda nao cadastrados podem{' '}
          <Link to={AUTH_SIGN_UP_ROUTE} className="text-primary underline-offset-4 hover:underline">
            criar a conta aqui
          </Link>
          .
        </>
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

        <form.Field name="password">
          {field => (
            <PasswordField
              id="password"
              label="Senha"
              value={field.state.value}
              onChange={value => field.handleChange(value)}
              onBlur={field.handleBlur}
              forgotPasswordLink
              errors={field.state.meta.errors}
              isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            />
          )}
        </form.Field>

        <AuthErrorMessage message={emailLogin.isError ? emailLogin.error.message : null} />

        <SubmitButton isPending={emailLogin.isPending} label="Entrar" pendingLabel="Entrando..." />
      </form>

      <OAuthDivider />

      <AuthCallout
        title="Continuar com Google"
        description="Mantenha a mesma conta Google usada no cadastro para evitar conflitos de autenticacao."
      >
        <GoogleLoginButton helperText="Se esta for sua primeira autenticacao com Google, voce pode ser direcionado para concluir o cadastro antes de acessar o sistema." />
      </AuthCallout>
    </AuthPageLayout>
  );
}
