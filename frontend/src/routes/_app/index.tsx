import type { ReactNode } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Bell, CalendarDays, CircleCheckBig, Clock3, Mail, Shield, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth, useMyCandidateProfile } from '@/hooks/use-auth';
import { mockCandidateHome } from '@/lib/mock-candidate-home';

export const Route = createFileRoute('/_app/')({
  component: HomePage,
});

const ROLE_LABELS: Record<string, string> = {
  professor: 'Professor',
  candidate: 'Candidato',
  'mdcc-secretary': 'Secretario MDCC',
  'post-graduate-coordinator': 'Coordenador de Pos-Graduacao',
};

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.charAt(0)?.toUpperCase() ?? '';
  const last = lastName?.charAt(0)?.toUpperCase() ?? '';

  return first + last || '?';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function HomePage() {
  const { data: user, isLoading } = useAuth();
  const isCandidate = user?.role === 'candidate';
  const { data: candidateProfile, isLoading: isCandidateProfileLoading } =
    useMyCandidateProfile(isCandidate);

  if (isLoading || (isCandidate && isCandidateProfileLoading)) {
    return <CandidateHomeSkeleton />;
  }

  if (!user) {
    return null;
  }

  if (user.role !== 'candidate') {
    return <FallbackHome />;
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Usuario';
  const initials = getInitials(user.firstName, user.lastName);
  const universityOfOrigin =
    candidateProfile?.universityOfOrigin || mockCandidateHome.profile.universityOfOrigin;
  const iraValue = candidateProfile?.ira?.trim() || 'Not set';
  const poscompValue =
    candidateProfile?.poscomp != null ? String(candidateProfile.poscomp) : 'Not set';

  return (
    <div className="anubis-page-shell min-h-svh px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <Card className="overflow-hidden rounded-[2rem]">
          <CardContent className="grid gap-6 p-7 sm:p-9 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-end">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">{mockCandidateHome.cycleName}</Badge>
                <Badge variant="secondary">{mockCandidateHome.summary.statusLabel}</Badge>
              </div>

              <div className="space-y-4">
                <p className="font-label text-primary">Home do candidato</p>
                <div className="space-y-4">
                  <h1 className="text-foreground font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                    {displayName}, sua candidatura segue em uma mesa de leitura clara e orientada
                    por prazos.
                  </h1>
                  <p className="text-muted-foreground max-w-3xl text-base leading-8">
                    Esta visao inicial usa dados simulados para a experiencia do candidato e
                    organiza o que vem a seguir: notificacoes, progresso, documentos e marcos do
                    processo seletivo.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard label="Progresso" value={mockCandidateHome.summary.progressLabel} />
                <MetricCard
                  label="Marco seguinte"
                  value={mockCandidateHome.summary.nextMilestone}
                />
                <MetricCard label="Perfil academico" value={universityOfOrigin} />
              </div>
            </div>

            <div className="anubis-glass anubis-ghost-border space-y-5 rounded-[1.75rem] p-6">
              <div className="flex items-center gap-4">
                <Avatar className="bg-primary/8 h-[4.5rem] w-[4.5rem] border-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <p className="text-foreground font-serif text-2xl">{displayName}</p>
                  <p className="text-muted-foreground text-sm">
                    {user.email ?? 'Email nao informado'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <ProfileLine
                  icon={<Shield className="h-4 w-4" />}
                  label="Perfil"
                  value={ROLE_LABELS[user.role] ?? user.role}
                />
                <ProfileLine
                  icon={<Mail className="h-4 w-4" />}
                  label="Universidade"
                  value={universityOfOrigin}
                />
                <ProfileLine
                  icon={<Sparkles className="h-4 w-4" />}
                  label="IRA / POSCOMP"
                  value={`${iraValue} / ${poscompValue}`}
                />
                <ProfileLine
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Conta criada"
                  value={formatDate(user.createdAt)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="space-y-3">
                <p className="font-label text-primary">Linha do tempo</p>
                <CardTitle>Etapas em destaque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockCandidateHome.timeline.map(item => (
                  <div key={item.title} className="anubis-surface-muted rounded-[1.5rem] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-foreground font-serif text-xl">{item.title}</p>
                        <p className="text-muted-foreground text-sm leading-6">
                          {item.description}
                        </p>
                      </div>
                      <Badge variant={item.status === 'current' ? 'default' : 'outline'}>
                        {item.date}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="space-y-3">
                <p className="font-label text-primary">Alertas e leitura rapida</p>
                <CardTitle>O que merece atencao agora</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockCandidateHome.notices.map(notice => (
                  <div key={notice.title} className="anubis-surface-muted rounded-[1.5rem] p-5">
                    <div className="text-primary mb-3 flex items-center gap-3">
                      <Bell className="h-4 w-4" />
                      <span className="font-label text-primary">{notice.tag}</span>
                    </div>
                    <p className="text-foreground font-serif text-xl">{notice.title}</p>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      {notice.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-3">
                <p className="font-label text-primary">Proximas acoes</p>
                <CardTitle>Checklist curado para esta semana</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockCandidateHome.tasks.map(task => (
                  <div key={task.title} className="anubis-surface-stack rounded-[1.5rem] p-5">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 text-primary mt-1 rounded-full p-2">
                        <CircleCheckBig className="h-4 w-4" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-foreground font-serif text-lg">{task.title}</p>
                          <Badge variant="outline">{task.emphasis}</Badge>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2 text-sm">
                          <Clock3 className="h-4 w-4" />
                          {task.due}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <Button className="w-full">Preparar documentacao</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="anubis-glass anubis-ghost-border rounded-[1.5rem] p-5">
      <p className="font-label text-muted-foreground">{label}</p>
      <p className="text-foreground mt-3 font-serif text-2xl leading-tight">{value}</p>
    </div>
  );
}

function ProfileLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="anubis-surface-stack rounded-[1.2rem] p-4">
      <div className="text-muted-foreground mb-2 flex items-center gap-2">
        {icon}
        <span className="font-label text-muted-foreground">{label}</span>
      </div>
      <p className="text-foreground text-sm leading-6">{value}</p>
    </div>
  );
}

function FallbackHome() {
  const { data: user } = useAuth();

  if (!user) {
    return null;
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Usuario';

  return (
    <div className="min-h-svh px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="rounded-[2rem]">
          <CardHeader className="space-y-3">
            <p className="font-label text-primary">Perfil</p>
            <CardTitle>{displayName}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-4 text-sm leading-6">
            <p>
              A nova home editorial foi implementada apenas para candidatos nesta fase. Seu acesso
              continua disponivel com uma visao segura enquanto os demais perfis aguardam a proxima
              iteracao.
            </p>
            <p>Email: {user.email ?? 'Nao informado'}</p>
            <p>Papel: {ROLE_LABELS[user.role] ?? user.role}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CandidateHomeSkeleton() {
  return (
    <div className="min-h-svh px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-80 w-full rounded-[2rem]" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-[2rem]" />
          <Skeleton className="h-96 w-full rounded-[2rem]" />
        </div>
      </div>
    </div>
  );
}
