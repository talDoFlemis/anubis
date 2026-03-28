import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AuthCallout,
  AuthErrorMessage,
  AuthPageLayout,
} from '@/components/auth/auth-layout';
import { GoogleLoginButton } from '@/components/google-login-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useEmailRegister } from '@/hooks/use-auth';

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

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
    <AuthPageLayout
      eyebrow="Cadastro"
      title="Abra sua candidatura em uma mesa de leitura clara e guiada."
      description="O cadastro inicial registra seus dados essenciais de candidato e prepara o percurso para confirmacao de email, autenticacao e etapas seguintes."
      asideTitle="Uma entrada pensada para candidatos, sem ruido e sem excesso."
      asideDescription="O formulario organiza apenas o necessario para abrir sua conta. Professores e demais perfis continuam por fluxos internos da equipe."
      metrics={[
        { label: 'Perfil', value: 'Candidato' },
        { label: 'Passo inicial', value: 'Conta' },
        { label: 'Confirmacao', value: 'Por email' },
      ]}
      notes={[
        'A conta e liberada apos a confirmacao do email informado neste formulario.',
        'Se preferir, voce tambem pode iniciar com Google e complementar seus dados de candidato logo apos a autenticacao.',
      ]}
      footer={
        <>
          Ja possui acesso?{' '}
          <Link
            to="/auth/sign-in"
            className="text-primary underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
          .
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nome</Label>
            <Input
              id="firstName"
              placeholder="Seu nome"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input
              id="lastName"
              placeholder="Seu sobrenome"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
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
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              inputMode="numeric"
              placeholder="Somente numeros"
              value={cpf}
              onChange={(event) => setCpf(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="universityOfOrigin">Universidade</Label>
            <Input
              id="universityOfOrigin"
              placeholder="Ex.: UFRN"
              value={universityOfOrigin}
              onChange={(event) => setUniversityOfOrigin(event.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="Minimo 6 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </div>

        <AuthErrorMessage
          message={register.isError ? register.error.message : null}
        />

        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>

      <div className="relative py-1">
        <Separator />
        <span className="anubis-surface-stack absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-1 text-[0.68rem] text-muted-foreground font-label">
          alternativa institucional
        </span>
      </div>

      <AuthCallout
        title="Iniciar com Google"
        description="Use a conta que pretende manter vinculada ao acompanhamento do processo seletivo."
      >
        <GoogleLoginButton
          text="signup_with"
          helperText="Quem continuar com Google pode precisar completar os dados de candidato logo apos a autenticacao."
        />
      </AuthCallout>
    </AuthPageLayout>
  );
}
