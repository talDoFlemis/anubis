import { HOME_ROLE_LABELS } from '@/components/home/home-role-labels';
import { HomeMetricCard } from '@/components/home/HomeMetricCard';
import { HomeProfileLine } from '@/components/home/HomeProfileLine';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { User } from '@/lib/api';
import { formatDatePtBr } from '@/lib/formatters';
import { mockCandidateHome } from '@/lib/mock-candidate-home';
import { CalendarDays, Mail, Shield, Sparkles } from 'lucide-react';

type CandidateHomeHeroProps = {
  displayName: string;
  initials: string;
  user: User;
  universityOfOrigin: string;
  iraValue: string;
  poscompValue: string;
};

export function CandidateHomeHero({
  displayName,
  initials,
  user,
  universityOfOrigin,
  iraValue,
  poscompValue,
}: CandidateHomeHeroProps) {
  return (
    <Card className="overflow-hidden rounded-4xl">
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
                {displayName}, sua candidatura segue em uma mesa de leitura clara e orientada por
                prazos.
              </h1>
              <p className="text-muted-foreground max-w-3xl text-base leading-8">
                Esta visao inicial usa dados simulados para a experiencia do candidato e organiza o
                que vem a seguir: notificacoes, progresso, documentos e marcos do processo seletivo.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <HomeMetricCard label="Progresso" value={mockCandidateHome.summary.progressLabel} />
            <HomeMetricCard
              label="Marco seguinte"
              value={mockCandidateHome.summary.nextMilestone}
            />
            <HomeMetricCard label="Perfil academico" value={universityOfOrigin} />
          </div>
        </div>

        <div className="anubis-glass anubis-ghost-border space-y-5 rounded-[1.75rem] p-6">
          <div className="flex items-center gap-4">
            <Avatar className="bg-primary/8 h-18 w-18 border-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p className="text-foreground font-serif text-2xl">{displayName}</p>
              <p className="text-muted-foreground text-sm">{user.email ?? 'Email nao informado'}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <HomeProfileLine
              icon={<Shield className="h-4 w-4" />}
              label="Perfil"
              value={HOME_ROLE_LABELS[user.role] ?? user.role}
            />
            <HomeProfileLine
              icon={<Mail className="h-4 w-4" />}
              label="Universidade"
              value={universityOfOrigin}
            />
            <HomeProfileLine
              icon={<Sparkles className="h-4 w-4" />}
              label="IRA / POSCOMP"
              value={`${iraValue} / ${poscompValue}`}
            />
            <HomeProfileLine
              icon={<CalendarDays className="h-4 w-4" />}
              label="Conta criada"
              value={formatDatePtBr(user.createdAt)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
