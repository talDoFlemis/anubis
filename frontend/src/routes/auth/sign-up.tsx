import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useEmailRegister } from '@/hooks/use-auth';
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
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/sign-up')({
  component: SignUpPage,
});

function SignUpPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cpf, setCpf] = useState('');
  const [universityOfOrigin, setUniversityOfOrigin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = useEmailRegister();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      {
        email,
        password,
        firstName,
        lastName,
        cpf,
        universityOfOrigin,
      },
      {
        onSuccess: () => {
          toast.success(
            'Conta criada! Verifique seu email para confirmar o cadastro.',
          );
          navigate({ to: '/auth/sign-in' });
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>
          Cadastro aberto apenas para candidatos. Professores recebem convite da
          equipe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                placeholder="Seu nome"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                placeholder="Seu sobrenome"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
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
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              inputMode="numeric"
              placeholder="Somente numeros"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="universityOfOrigin">Universidade de origem</Label>
            <Input
              id="universityOfOrigin"
              placeholder="Ex.: UFRN"
              value={universityOfOrigin}
              onChange={(e) => setUniversityOfOrigin(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
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

          {register.isError && (
            <p className="text-sm text-destructive">{register.error.message}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={register.isPending}
          >
            {register.isPending ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>

        <div className="relative my-4">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            ou
          </span>
        </div>

        <GoogleLoginButton
          text="signup_with"
          helperText="Quem continuar com Google pode precisar completar os dados de candidato logo apos a autenticacao."
        />
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Ja tem uma conta?{' '}
          <Link
            to="/auth/sign-in"
            className="text-primary underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
