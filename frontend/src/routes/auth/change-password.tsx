import { createFileRoute, useNavigate } from '@tanstack/react-router';
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
import { useLogout, useUpdateProfile } from '@/hooks/use-auth';
import { getPostAuthPath } from '@/lib/auth-flow';

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error('As senhas nao coincidem.');
      return;
    }

    updateProfile.mutate(
      {
        oldPassword: currentPassword,
        password,
      },
      {
        onSuccess: (updatedUser) => {
          toast.success('Senha atualizada com sucesso.');
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
      notes={[
        'Use a senha temporaria recebida anteriormente para autorizar a troca nesta etapa.',
      ]}
      compact
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Senha atual</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Informe a senha temporaria"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            placeholder="Minimo 6 caracteres"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={6}
            placeholder="Repita a nova senha"
            required
          />
        </div>

        <AuthErrorMessage
          message={updateProfile.isError ? updateProfile.error.message : null}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? 'Salvando...' : 'Salvar nova senha'}
        </Button>
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
