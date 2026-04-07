import { createFileRoute } from '@tanstack/react-router';
import { HashConfirmationPage } from '@/components/auth';
import { useConfirmNewEmail } from '@/hooks/use-auth';
import { AUTH_CONFIRM_NEW_EMAIL_ROUTE, AUTH_HOME_ROUTE, validateHashSearch } from '@/lib/auth-flow';

export const Route = createFileRoute(AUTH_CONFIRM_NEW_EMAIL_ROUTE)({
  validateSearch: validateHashSearch,
  component: ConfirmNewEmailPage,
});

const CONFIRM_NEW_EMAIL_CONFIG = {
  eyebrow: 'Atualizacao de email',
  invalidHash: {
    title: 'O link de confirmacao nao pode ser lido.',
    description:
      'Abra novamente a mensagem mais recente enviada para o novo endereco e tente outra vez.',
    calloutTitle: 'Link invalido',
    calloutDescription: 'A confirmacao do novo email precisa de um link completo e ainda valido.',
  },
  pending: {
    title: 'Confirmando o novo endereco da sua conta.',
    description:
      'Estamos validando a alteracao para concluir a atualizacao do seu acesso principal.',
    calloutTitle: 'Validando o novo email',
    calloutDescription: 'Aguarde alguns instantes enquanto a alteracao e registrada.',
  },
  error: {
    title: 'Nao foi possivel confirmar o novo endereco.',
    description:
      'Revise o link recebido ou retorne ao inicio para repetir o fluxo de atualizacao quando necessario.',
    calloutTitle: 'Erro na confirmacao',
  },
  success: {
    title: 'Seu novo email foi confirmado.',
    description:
      'A alteracao de contato ja esta registrada e pronta para ser usada nos proximos acessos.',
    calloutTitle: 'Atualizacao concluida',
    calloutDescription:
      'Volte ao ambiente principal para seguir usando o Anubis com o novo endereco.',
  },
  successEyebrow: 'Email atualizado',
  successAction: { label: 'Voltar ao inicio', to: AUTH_HOME_ROUTE },
  errorAction: { label: 'Voltar ao inicio', to: AUTH_HOME_ROUTE },
} as const;

function ConfirmNewEmailPage() {
  const { hash } = Route.useSearch();
  const confirmNewEmail = useConfirmNewEmail();

  return (
    <HashConfirmationPage
      hash={hash}
      mutation={confirmNewEmail}
      config={CONFIRM_NEW_EMAIL_CONFIG}
    />
  );
}
