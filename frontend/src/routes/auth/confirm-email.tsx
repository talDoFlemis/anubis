import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { CheckCircle, LoaderCircle, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { AuthCallout, AuthPageLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { useConfirmEmail } from '@/hooks/use-auth';

interface ConfirmEmailSearch {
  hash: string;
}

export const Route = createFileRoute('/auth/confirm-email')({
  validateSearch: (search: Record<string, unknown>): ConfirmEmailSearch => ({
    hash: (search.hash as string) || '',
  }),
  component: ConfirmEmailPage,
});

function ConfirmEmailPage() {
  const { hash } = Route.useSearch();
  const confirmEmail = useConfirmEmail();
  const navigate = useNavigate();

  useEffect(() => {
    if (hash) {
      confirmEmail.mutate({ hash });
    }
  }, [hash]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hash) {
    return (
      <AuthPageLayout
        eyebrow="Confirmacao"
        title="O link de ativacao nao pode ser lido."
        description="Abra novamente a mensagem recebida por email ou solicite um novo cadastro se necessario."
        compact
        status={
          <AuthCallout
            title="Link invalido"
            description="O endereco de confirmacao esta ausente, incompleto ou expirado."
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

  if (confirmEmail.isPending) {
    return (
      <AuthPageLayout
        eyebrow="Confirmacao"
        title="Estamos confirmando o seu email."
        description="A validacao da conta leva apenas alguns instantes. Quando concluida, o acesso por login sera liberado."
        compact
        status={
          <AuthCallout
            title="Validando a ativacao"
            description="Mantenha esta aba aberta enquanto o sistema confirma sua conta."
          >
            <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          </AuthCallout>
        }
      >
        <div />
      </AuthPageLayout>
    );
  }

  if (confirmEmail.isError) {
    return (
      <AuthPageLayout
        eyebrow="Confirmacao"
        title="Nao foi possivel ativar sua conta."
        description="O link pode ter expirado ou ja ter sido utilizado. Revise a mensagem recebida ou retome o acesso pela tela de login."
        compact
        status={
          <AuthCallout
            title="Erro na confirmacao"
            description={confirmEmail.error.message}
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

  return (
    <AuthPageLayout
      eyebrow="Conta ativada"
      title="Seu email foi confirmado com sucesso."
      description="A conta esta ativa e pronta para continuar o fluxo de autenticacao no Anubis."
      compact
      status={
        <AuthCallout
          title="Ativacao concluida"
          description="Voce ja pode entrar e seguir para as proximas etapas da candidatura."
        >
          <CheckCircle className="h-5 w-5 text-primary" />
        </AuthCallout>
      }
      footer={
        <Button asChild>
          <Link to="/auth/sign-in">Ir para o login</Link>
        </Button>
      }
    >
      <div />
    </AuthPageLayout>
  );
}
