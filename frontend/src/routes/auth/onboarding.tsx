import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { AuthCallout, AuthErrorMessage, AuthPageLayout, SubmitButton } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useCompleteCandidateOnboarding, useLogout } from '@/hooks/use-auth';
import { getPostAuthPath } from '@/lib/auth-flow';

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
        onSuccess: updatedUser => {
          toast.success('Cadastro concluido com sucesso.');
          navigate({ to: getPostAuthPath(updatedUser) });
        },
      },
    );
  };

  return (
    <AuthPageLayout
      eyebrow="Concluir cadastro"
      title="Feche seu perfil academico antes de entrar na area do candidato."
      description="Precisamos registrar os dados complementares do candidato para liberar o acompanhamento do processo e personalizar as proximas etapas."
      asideTitle="Concluir agora evita ruído depois."
      asideDescription="Este e o fechamento do seu cadastro inicial. Ao confirmar as informacoes, o sistema libera a experiencia completa da area do candidato."
      metrics={[
        { label: 'Etapa', value: 'Perfil' },
        { label: 'Campos', value: 'Basicos + opcionais' },
        { label: 'Saida', value: 'Home do candidato' },
      ]}
      notes={[
        'IRA e POSCOMP sao opcionais nesta etapa, mas ajudam a consolidar seu perfil academico desde o inicio.',
        'Se voce entrou com uma conta incorreta, saia agora e reinicie a autenticacao antes de concluir este formulario.',
      ]}
      compact
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nome</Label>
            <Input
              id="firstName"
              value={resolvedFirstName}
              onChange={event => setFirstName(event.target.value)}
              placeholder="Seu nome"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input
              id="lastName"
              value={resolvedLastName}
              onChange={event => setLastName(event.target.value)}
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
            onChange={event => setCpf(event.target.value)}
            placeholder="Somente numeros"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="universityOfOrigin">Universidade de origem</Label>
          <Input
            id="universityOfOrigin"
            value={universityOfOrigin}
            onChange={event => setUniversityOfOrigin(event.target.value)}
            placeholder="Ex.: UFRN"
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ira">IRA (opcional)</Label>
            <Input
              id="ira"
              inputMode="decimal"
              value={ira}
              onChange={event => setIra(event.target.value)}
              placeholder="Ex.: 8.75"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="poscomp">POSCOMP (opcional)</Label>
            <Input
              id="poscomp"
              inputMode="numeric"
              value={poscomp}
              onChange={event => setPoscomp(event.target.value)}
              placeholder="Ex.: 780"
            />
          </div>
        </div>

        <AuthErrorMessage message={onboarding.isError ? onboarding.error.message : null} />

        <SubmitButton
          isPending={onboarding.isPending}
          label="Concluir cadastro"
          pendingLabel="Salvando..."
        />
      </form>

      <AuthCallout
        title="Precisa trocar de conta?"
        description="Saia agora para reiniciar a autenticacao com outro perfil antes de gravar os dados de candidato."
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
