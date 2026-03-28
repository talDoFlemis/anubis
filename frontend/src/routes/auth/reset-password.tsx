import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { KeyRound, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AuthCallout,
  AuthErrorMessage,
  AuthPageLayout,
} from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResetPassword } from '@/hooks/use-auth';

interface ResetPasswordSearch {
  hash: string;
}

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    hash: (search.hash as string) || '',
  }),
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
            <XCircle className="h-5 w-5 text-destructive" />
          </AuthCallout>
        }
        footer={
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/auth/sign-in' })}
          >
            Ir para o login
          </Button>
        }
      >
        <div />
      </AuthPageLayout>
    );
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error('As senhas nao coincidem.');
      return;
    }

    resetPassword.mutate(
      { hash, password },
      {
        onSuccess: () => {
          toast.success('Senha redefinida com sucesso!');
          navigate({ to: '/auth/sign-in' });
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
          <KeyRound className="h-5 w-5 text-primary" />
        </AuthCallout>
      }
      footer={
        <Link
          to="/auth/sign-in"
          className="text-primary underline-offset-4 hover:underline"
        >
          Cancelar e voltar ao login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Minimo 6 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repita a nova senha"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={6}
            required
          />
        </div>

        <AuthErrorMessage
          message={resetPassword.isError ? resetPassword.error.message : null}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={resetPassword.isPending}
        >
          {resetPassword.isPending ? 'Redefinindo...' : 'Redefinir senha'}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
