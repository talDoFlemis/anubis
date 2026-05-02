import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import {
  AuthCallout,
  AuthErrorMessage,
  AuthPageLayout,
  PasswordField,
  SubmitButton,
} from '@/components/auth';
import { Button } from '@/components/ui/button';
import { useLogout, useUpdateProfile } from '@/hooks/use-auth';
import { getPostAuthPath, validatePasswordMatch } from '@/lib/auth-flow';

export const Route = createFileRoute('/auth/change-password')({
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const navigate = useNavigate();

  const handleSubmit = (event: React.SubmitEvent) => {
    event.preventDefault();

    if (!validatePasswordMatch(password, confirmPassword)) {
      return;
    }

    updateProfile.mutate(
      {
        oldPassword: currentPassword,
        password,
      },
      {
        onSuccess: updatedUser => {
          navigate({ to: getPostAuthPath(updatedUser) });
        },
      },
    );
  };

  return (
    <AuthPageLayout
      eyebrow="Atualizacao obrigatoria"
      title="Defina uma nova senha para continuar no ambiente do candidato."
      description="Seu acesso atual e temporario. Troque a senha agora para seguir com um credencial permanente e segura."
      asideTitle="Uma unica etapa separa o acesso temporario da continuidade do processo."
      asideDescription="Troque a senha antes de prosseguir para a area inicial. Depois disso, o fluxo volta ao percurso normal do candidato."
      metrics={[
        { label: 'Estado atual', value: 'Temporario' },
        { label: 'Acao', value: 'Nova senha' },
        { label: 'Destino', value: 'Home' },
      ]}
      notes={['Use a senha temporaria recebida anteriormente para autorizar a troca nesta etapa.']}
      compact
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordField
          id="currentPassword"
          label="Senha atual"
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder="Informe a senha temporaria"
        />

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
          label="Confirmar nova senha"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repita a nova senha"
          minLength={6}
        />

        <AuthErrorMessage message={updateProfile.isError ? updateProfile.error.message : null} />

        <SubmitButton
          isPending={updateProfile.isPending}
          label="Salvar nova senha"
          pendingLabel="Salvando..."
        />
      </form>

      <AuthCallout
        title="Encerrar esta sessao"
        description="Se preferir reiniciar o processo com outra conta ou outra credencial, saia antes de concluir a troca."
      >
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          {logout.isPending ? 'Saindo...' : 'Sair desta conta'}
        </Button>
      </AuthCallout>
    </AuthPageLayout>
  );
}
