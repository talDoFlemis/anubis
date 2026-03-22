import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogout, useUpdateProfile } from '@/hooks/use-auth';
import { getPostAuthPath } from '@/lib/auth-flow';
import { toast } from 'sonner';

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
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Atualize sua senha</CardTitle>
        <CardDescription>
          Seu acesso atual e temporario. Defina uma nova senha para continuar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {updateProfile.isError ? (
            <p className="text-sm text-destructive">
              {updateProfile.error.message}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? 'Salvando...' : 'Salvar nova senha'}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? 'Saindo...' : 'Sair desta conta'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
