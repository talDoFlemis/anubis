import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AuthErrorMessage,
  AuthPageLayout,
} from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForgotPassword } from '@/hooks/use-auth';

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const forgotPassword = useForgotPassword();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    forgotPassword.mutate(
      { email },
      {
        onSuccess: () => {
          toast.success(
            'Email enviado! Verifique sua caixa de entrada para redefinir a senha.',
          );
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
        <Link
          to="/auth/sign-in"
          className="text-primary underline-offset-4 hover:underline"
        >
          Voltar para o login
        </Link>
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

        <AuthErrorMessage
          message={forgotPassword.isError ? forgotPassword.error.message : null}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={forgotPassword.isPending}
        >
          {forgotPassword.isPending
            ? 'Enviando...'
            : 'Enviar link de recuperacao'}
        </Button>
      </form>
    </AuthPageLayout>
  );
}
