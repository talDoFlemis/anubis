import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
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
import { AUTH_SIGN_IN_ROUTE } from '@/lib/auth-flow';

export const Route = createFileRoute('/auth/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const emailLogin = useEmailLogin();

  const handleSubmit = (event: React.SubmitEvent) => {
    event.preventDefault();
    emailLogin.mutate({ email, password });
  };

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
          <Link to={AUTH_SIGN_IN_ROUTE} className="text-primary underline-offset-4 hover:underline">
            criar a conta aqui
          </Link>
          .
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <EmailField value={email} onChange={setEmail} />

        <PasswordField
          id="password"
          label="Senha"
          value={password}
          onChange={setPassword}
          forgotPasswordLink
        />

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
