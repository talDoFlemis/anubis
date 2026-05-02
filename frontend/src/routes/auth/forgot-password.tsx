import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { AuthErrorMessage, AuthPageLayout, EmailField, SubmitButton } from '@/components/auth';
import { useForgotPassword } from '@/hooks/use-auth';
import { AUTH_HOME_ROUTE } from '@/lib/auth-flow';

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const forgotPassword = useForgotPassword();

  const handleSubmit = (event: React.SubmitEvent) => {
    event.preventDefault();

    forgotPassword.mutate(
      { email },
      {
        onSuccess: () => {
          toast.success('Email enviado! Verifique sua caixa de entrada para redefinir a senha.');
        },
      },
    );
  };

  return (
    <AuthPageLayout
      eyebrow="Recuperacao"
      title="Peça um novo acesso sem perder o ritmo da candidatura."
      description="Informe o email da conta para receber o link de redefinicao e retomar sua entrada com seguranca."
      asideTitle="A recuperacao tambem segue o mesmo fio editorial."
      asideDescription="O processo evita friccao: um unico campo, uma unica acao primaria e continuidade clara para a proxima etapa."
      metrics={[
        { label: 'Canal', value: 'Email' },
        { label: 'Tempo', value: 'Poucos minutos' },
        { label: 'Acao', value: '1 link seguro' },
      ]}
      notes={[
        'Se o endereco existir e estiver apto para o fluxo de senha, voce recebera o link de recuperacao na caixa de entrada.',
      ]}
      compact
      footer={
        <Link to={AUTH_HOME_ROUTE} className="text-primary underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <EmailField value={email} onChange={setEmail} />

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
