import { createFileRoute } from '@tanstack/react-router';
import { HashConfirmationPage } from '@/components/auth';
import { useConfirmEmail } from '@/hooks/use-auth';
import { AUTH_CONFIRM_EMAIL_ROUTE, AUTH_SIGN_IN_ROUTE, validateHashSearch } from '@/lib/auth-flow';

export const Route = createFileRoute(AUTH_CONFIRM_EMAIL_ROUTE)({
  validateSearch: validateHashSearch,
  component: ConfirmEmailPage,
});

const CONFIRM_EMAIL_CONFIG = {
  eyebrow: 'Confirmacao',
  invalidHash: {
    title: 'O link de ativacao nao pode ser lido.',
    description:
      'Abra novamente a mensagem recebida por email ou solicite um novo cadastro se necessario.',
    calloutTitle: 'Link invalido',
    calloutDescription: 'O endereco de confirmacao esta ausente, incompleto ou expirado.',
  },
  pending: {
    title: 'Estamos confirmando o seu email.',
    description:
      'A validacao da conta leva apenas alguns instantes. Quando concluida, o acesso por login sera liberado.',
    calloutTitle: 'Validando a ativacao',
    calloutDescription: 'Mantenha esta aba aberta enquanto o sistema confirma sua conta.',
  },
  error: {
    title: 'Nao foi possivel ativar sua conta.',
    description:
      'O link pode ter expirado ou ja ter sido utilizado. Revise a mensagem recebida ou retome o acesso pela tela de login.',
    calloutTitle: 'Erro na confirmacao',
  },
  success: {
    title: 'Seu email foi confirmado com sucesso.',
    description: 'A conta esta ativa e pronta para continuar o fluxo de autenticacao no Anubis.',
    calloutTitle: 'Ativacao concluida',
    calloutDescription: 'Voce ja pode entrar e seguir para as proximas etapas da candidatura.',
  },
  successEyebrow: 'Conta ativada',
  successAction: { label: 'Ir para o login', to: AUTH_SIGN_IN_ROUTE },
  errorAction: { label: 'Ir para o login', to: AUTH_SIGN_IN_ROUTE },
} as const;

function ConfirmEmailPage() {
  const { hash } = Route.useSearch();
  const confirmEmail = useConfirmEmail();

  return <HashConfirmationPage hash={hash} mutation={confirmEmail} config={CONFIRM_EMAIL_CONFIG} />;
}
