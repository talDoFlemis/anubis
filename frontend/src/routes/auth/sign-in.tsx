import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useEmailLogin } from '@/hooks/use-auth';
import { GoogleLoginButton } from '@/components/google-login-button';
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
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/auth/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const emailLogin = useEmailLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    emailLogin.mutate({ email, password });
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Entrar</CardTitle>
        <CardDescription>Acesse sua conta para continuar.</CardDescription>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link
                to="/auth/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {emailLogin.isError && (
            <p className="text-sm text-destructive">
              {emailLogin.error.message}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={emailLogin.isPending}
          >
            {emailLogin.isPending ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="relative my-4">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            ou
          </span>
        </div>

        <GoogleLoginButton helperText="Se esta for seu primeiro login com Google, voce pode ser direcionado para concluir o onboarding antes de acessar o sistema." />
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Candidatos ainda nao cadastrados podem{' '}
          <Link
            to="/auth/sign-up"
            className="text-primary underline-offset-4 hover:underline"
          >
            criar conta aqui
          </Link>
          .
        </p>
      </CardFooter>
    </Card>
  );
}
