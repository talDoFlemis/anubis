import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  AuthCallout,
  AuthErrorMessage,
  AuthPageLayout,
} from '@/components/auth/auth-layout';
import { GoogleLoginButton } from '@/components/google-login-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useEmailLogin } from '@/hooks/use-auth';

export const Route = createFileRoute('/auth/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const emailLogin = useEmailLogin();

  const handleSubmit = (event: React.FormEvent) => {
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
          <Link
            to="/auth/sign-up"
            className="text-primary underline-offset-4 hover:underline"
          >
            criar a conta aqui
          </Link>
          .
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Senha</Label>
            <Link
              to="/auth/forgot-password"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Recuperar acesso
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <AuthErrorMessage
          message={emailLogin.isError ? emailLogin.error.message : null}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={emailLogin.isPending}
        >
          {emailLogin.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <div className="relative py-1">
        <Separator />
        <span className="anubis-surface-stack absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-1 text-[0.68rem] text-muted-foreground font-label">
          alternativa de acesso
        </span>
      </div>

      <AuthCallout
        title="Continuar com Google"
        description="Mantenha a mesma conta Google usada no cadastro para evitar conflitos de autenticacao."
      >
        <GoogleLoginButton helperText="Se esta for sua primeira autenticacao com Google, voce pode ser direcionado para concluir o cadastro antes de acessar o sistema." />
      </AuthCallout>
    </AuthPageLayout>
  );
}
