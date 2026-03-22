import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useResetPassword } from '@/hooks/use-auth';
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
import { toast } from 'sonner';
import { XCircle } from 'lucide-react';

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
      <Card>
        <CardHeader className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <CardTitle className="text-2xl">Link invalido</CardTitle>
          <CardDescription>
            O link de recuperacao nao e valido ou expirou.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/auth/sign-in' })}
          >
            Ir para o login
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Redefinir senha</CardTitle>
        <CardDescription>Informe sua nova senha</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {resetPassword.isError && (
            <p className="text-sm text-destructive">
              {resetPassword.error.message}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={resetPassword.isPending}
          >
            {resetPassword.isPending ? 'Redefinindo...' : 'Redefinir senha'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
