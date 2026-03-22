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
import {
  useAuth,
  useCompleteCandidateOnboarding,
  useLogout,
} from '@/hooks/use-auth';
import { getPostAuthPath } from '@/lib/auth-flow';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/onboarding')({
  component: CandidateOnboardingPage,
});

function CandidateOnboardingPage() {
  const { data: user } = useAuth();
  const onboarding = useCompleteCandidateOnboarding();
  const logout = useLogout();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [cpf, setCpf] = useState<string | null>(null);
  const [universityOfOrigin, setUniversityOfOrigin] = useState('');
  const [ira, setIra] = useState('');
  const [poscomp, setPoscomp] = useState('');

  const resolvedFirstName = firstName ?? user?.firstName ?? '';
  const resolvedLastName = lastName ?? user?.lastName ?? '';
  const resolvedCpf = cpf ?? user?.cpf ?? '';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    onboarding.mutate(
      {
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        cpf: resolvedCpf,
        universityOfOrigin,
        ira: ira || undefined,
        poscomp: poscomp ? Number(poscomp) : undefined,
      },
      {
        onSuccess: (updatedUser) => {
          toast.success('Cadastro concluido com sucesso.');
          navigate({ to: getPostAuthPath(updatedUser) });
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Complete seu cadastro</CardTitle>
        <CardDescription>
          Precisamos confirmar seus dados de candidato antes de liberar o
          acesso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                value={resolvedFirstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                value={resolvedLastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Seu sobrenome"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              inputMode="numeric"
              value={resolvedCpf}
              onChange={(event) => setCpf(event.target.value)}
              placeholder="Somente numeros"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="universityOfOrigin">Universidade de origem</Label>
            <Input
              id="universityOfOrigin"
              value={universityOfOrigin}
              onChange={(event) => setUniversityOfOrigin(event.target.value)}
              placeholder="Ex.: UFRN"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ira">IRA (opcional)</Label>
              <Input
                id="ira"
                inputMode="decimal"
                value={ira}
                onChange={(event) => setIra(event.target.value)}
                placeholder="Ex.: 8.75"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poscomp">POSCOMP (opcional)</Label>
              <Input
                id="poscomp"
                inputMode="numeric"
                value={poscomp}
                onChange={(event) => setPoscomp(event.target.value)}
                placeholder="Ex.: 780"
              />
            </div>
          </div>

          {onboarding.isError ? (
            <p className="text-sm text-destructive">
              {onboarding.error.message}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={onboarding.isPending}
          >
            {onboarding.isPending ? 'Salvando...' : 'Concluir cadastro'}
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
