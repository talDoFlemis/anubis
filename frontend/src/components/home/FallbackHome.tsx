import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/lib/api';
import { HOME_ROLE_LABELS } from './home-role-labels';
import { getUserDisplayName } from './home-user';

type FallbackHomeProps = {
  user: User;
};

export function FallbackHome({ user }: FallbackHomeProps) {
  const displayName = getUserDisplayName(user.firstName, user.lastName);

  return (
    <div className="min-h-svh px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="rounded-4xl">
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
            <p>Papel: {HOME_ROLE_LABELS[user.role] ?? user.role}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
