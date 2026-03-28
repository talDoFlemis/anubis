import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { CheckCircle, LoaderCircle, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { AuthCallout, AuthPageLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { useConfirmNewEmail } from '@/hooks/use-auth';

interface ConfirmNewEmailSearch {
  hash: string;
}

export const Route = createFileRoute('/auth/confirm-new-email')({
  validateSearch: (search: Record<string, unknown>): ConfirmNewEmailSearch => ({
    hash: (search.hash as string) || '',
  }),
  component: ConfirmNewEmailPage,
});

function ConfirmNewEmailPage() {
  const { hash } = Route.useSearch();
  const confirmNewEmail = useConfirmNewEmail();
  const navigate = useNavigate();

  useEffect(() => {
    if (hash) {
      confirmNewEmail.mutate({ hash });
    }
  }, [hash]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hash) {
    return (
      <AuthPageLayout
        eyebrow="Atualizacao de email"
        title="O link de confirmacao nao pode ser lido."
        description="Abra novamente a mensagem mais recente enviada para o novo endereco e tente outra vez."
        compact
        status={
          <AuthCallout
            title="Link invalido"
            description="A confirmacao do novo email precisa de um link completo e ainda valido."
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

  if (confirmNewEmail.isPending) {
    return (
      <AuthPageLayout
        eyebrow="Atualizacao de email"
        title="Confirmando o novo endereco da sua conta."
        description="Estamos validando a alteracao para concluir a atualizacao do seu acesso principal."
        compact
        status={
          <AuthCallout
            title="Validando o novo email"
            description="Aguarde alguns instantes enquanto a alteracao e registrada."
          >
            <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          </AuthCallout>
        }
      >
        <div />
      </AuthPageLayout>
    );
  }

  if (confirmNewEmail.isError) {
    return (
      <AuthPageLayout
        eyebrow="Atualizacao de email"
        title="Nao foi possivel confirmar o novo endereco."
        description="Revise o link recebido ou retorne ao inicio para repetir o fluxo de atualizacao quando necessario."
        compact
        status={
          <AuthCallout
            title="Erro na confirmacao"
            description={confirmNewEmail.error.message}
            className="bg-[rgba(186,26,26,0.08)]"
          >
            <XCircle className="h-5 w-5 text-destructive" />
          </AuthCallout>
        }
        footer={
          <Button variant="outline" onClick={() => navigate({ to: '/' })}>
            Voltar ao inicio
          </Button>
        }
      >
        <div />
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      eyebrow="Email atualizado"
      title="Seu novo email foi confirmado."
      description="A alteracao de contato ja esta registrada e pronta para ser usada nos proximos acessos."
      compact
      status={
        <AuthCallout
          title="Atualizacao concluida"
          description="Volte ao ambiente principal para seguir usando o Anubis com o novo endereco."
        >
          <CheckCircle className="h-5 w-5 text-primary" />
        </AuthCallout>
      }
      footer={
        <Button asChild>
          <Link to="/">Voltar ao inicio</Link>
        </Button>
      }
    >
      <div />
    </AuthPageLayout>
  );
}
