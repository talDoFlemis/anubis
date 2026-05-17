import { getUserDisplayName } from '@/components/home/home-user';
import { HomeShell } from '@/components/home/HomeLayout';
import { HomeMetricCard } from '@/components/home/HomeMetricCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/lib/api';
import { formatDatePtBr, formatNumberPtBr } from '@/lib/formatters';
import { mockProfessorHome } from '@/lib/mock-professor-home';
import { toast } from 'sonner';

type ProfessorHomeProps = {
  user: User;
};

export function ProfessorHome({ user }: ProfessorHomeProps) {
  const displayName = getUserDisplayName(user.firstName, user.lastName, 'Professor');
  const metrics = mockProfessorHome.metrics;

  const handleRegisterNewTheme = () => {
    toast.warning('Funcionalidade de cadastro de novo tema ainda não implementada.');
  };
  const handleEditTheme = (_theme: (typeof mockProfessorHome.themes)[0]) => {
    toast.warning('Funcionalidade de edição de tema ainda não implementada.');
  };
  const handleSeeCandidatesTheme = (_theme: (typeof mockProfessorHome.themes)[0]) => {
    toast.warning('Funcionalidade de ver candidatos de tema ainda não implementada.');
  };

  return (
    <HomeShell>
      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <Card className="overflow-hidden rounded-4xl">
          <CardContent className="space-y-6 p-7 sm:p-9">
            <div className="space-y-4">
              <p className="font-label text-primary">Portal do docente</p>
              <div className="space-y-3">
                <h1 className="text-foreground font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                  Olá, Prof. {displayName}
                </h1>
                <p className="text-muted-foreground max-w-3xl text-base leading-8">
                  Este painel resume os temas ativos, as vagas abertas e os candidatos inscritos no
                  ciclo atual do programa.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <HomeMetricCard
                label="Temas publicados"
                value={formatNumberPtBr(metrics.publishedThemes)}
              />
              <HomeMetricCard
                label="Vagas ofertadas"
                value={formatNumberPtBr(metrics.offeredSlots)}
              />
              <HomeMetricCard
                label="Candidatos inscritos"
                value={formatNumberPtBr(metrics.enrolledCandidates)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-4xl">
          <CardHeader className="flex flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-3">
              <p className="font-label text-primary">Meus temas de pesquisa</p>
              <CardTitle>Gestão de temas e candidatos</CardTitle>
            </div>
            <Button onClick={handleRegisterNewTheme}>Cadastrar novo tema</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockProfessorHome.themes.map(theme => (
              <div key={theme.id} className="anubis-surface-muted rounded-3xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-foreground font-serif text-xl">{theme.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {renderResearchLines(theme.researchLines)}
                      </div>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                      <span>Atualizado em {formatDatePtBr(theme.updatedAt)}</span>
                      <span>Vagas: {formatNumberPtBr(theme.slots)}</span>
                      <span>Candidatos: {formatNumberPtBr(theme.candidates)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="secondary" onClick={() => handleEditTheme(theme)}>
                      Editar
                    </Button>
                    <Button variant="secondary" onClick={() => handleSeeCandidatesTheme(theme)}>
                      Ver candidatos
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </HomeShell>
  );
}

function renderResearchLines(researchLines: string[]) {
  const visibleLines = researchLines.slice(0, 2);
  const remainingCount = Math.max(0, researchLines.length - visibleLines.length);

  return (
    <>
      {visibleLines.map(line => (
        <Badge key={line} variant="outline">
          {line}
        </Badge>
      ))}
      {remainingCount > 0 ? <Badge variant="outline">+{remainingCount}</Badge> : null}
    </>
  );
}
