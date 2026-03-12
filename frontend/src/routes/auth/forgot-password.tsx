import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForgotPassword } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const forgotPassword = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Esqueceu a senha?</CardTitle>
        <CardDescription>
          Informe seu email para receber o link de recuperacao
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {forgotPassword.isError && (
            <p className="text-sm text-destructive">
              {forgotPassword.error instanceof ApiError
                ? forgotPassword.error.message
                : 'Erro ao enviar email. Tente novamente.'}
            </p>
          )}

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
      </CardContent>
      <CardFooter className="justify-center">
        <Link
          to="/auth/sign-in"
          className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
        >
          Voltar para o login
        </Link>
      </CardFooter>
    </Card>
  );
}
