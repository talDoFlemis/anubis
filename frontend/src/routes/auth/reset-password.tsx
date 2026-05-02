import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { KeyRound, XCircle } from 'lucide-react';
import { useState } from 'react';
import {
  AuthCallout,
  AuthErrorMessage,
  AuthPageLayout,
  PasswordField,
  SubmitButton,
} from '@/components/auth';
import { Button } from '@/components/ui/button';
import { useResetPassword } from '@/hooks/use-auth';
import { AUTH_SIGN_IN_ROUTE, validateHashSearch, validatePasswordMatch } from '@/lib/auth-flow';

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: validateHashSearch,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { hash } = Route.useSearch();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const resetPassword = useResetPassword();
  const navigate = useNavigate();

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

  const handleSubmit = (event: React.SubmitEvent) => {
    event.preventDefault();

    if (!validatePasswordMatch(password, confirmPassword)) {
      return;
    }

    resetPassword.mutate(
      { hash, password },
      {
        onSuccess: () => {
          navigate({ to: AUTH_SIGN_IN_ROUTE });
        },
      },
    );
  };

  return (
    <AuthPageLayout
      eyebrow="Nova senha"
      title="Defina uma nova senha para retomar seu acesso."
      description="Escolha uma senha nova e confirme abaixo. Assim que o envio for concluido, voce podera entrar novamente no Anubis."
      asideTitle="A redefinicao fecha o ciclo com uma unica decisao clara."
      asideDescription="Sem menus paralelos, sem etapas ambíguas: informe a nova senha, confirme e retorne ao ambiente de candidatura."
      metrics={[
        { label: 'Passo', value: 'Senha' },
        { label: 'Seguranca', value: 'Confirmacao' },
        { label: 'Retorno', value: 'Login' },
      ]}
      notes={['Depois de salvar, use a nova senha no proximo acesso.']}
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordField
          id="password"
          label="Nova senha"
          value={password}
          onChange={setPassword}
          placeholder="Minimo 6 caracteres"
          minLength={6}
        />

        <PasswordField
          id="confirmPassword"
          label="Confirmar senha"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repita a nova senha"
          minLength={6}
        />

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
