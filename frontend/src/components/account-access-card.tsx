import { useState } from 'react';
import { toast } from 'sonner';
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
import { useUpdateProfile } from '@/hooks/use-auth';
import type { User } from '@/lib/api';

interface AccountAccessCardProps {
  user: User;
}

export function AccountAccessCard({ user }: AccountAccessCardProps) {
  const [emailDraft, setEmailDraft] = useState(user.email ?? '');
  const updateProfile = useUpdateProfile();

  const handleRequestEmail = (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedEmail = emailDraft.trim();

    if (!normalizedEmail) {
      toast.error('Informe um email para receber o link de confirmacao.');
      return;
    }

    updateProfile.mutate(
      { email: normalizedEmail },
      {
        onSuccess: () => {
          toast.success(`Enviamos um link para confirmar ${normalizedEmail}.`);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Acesso da conta</CardTitle>
        <CardDescription>
          Consulte o email principal desta conta e solicite a confirmacao de um
          novo endereco quando precisar atualizar o contato.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="anubis-surface-muted anubis-ghost-border space-y-2 rounded-[1.5rem] p-5">
          <p className="text-sm text-muted-foreground">Email atual</p>
          <p className="font-medium text-foreground">
            {user.email ?? 'Nao informado'}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            A troca de senha acontece pelo fluxo de redefinicao ou pela etapa de
            atualizacao obrigatoria quando aplicavel.
          </p>
        </div>

        <form onSubmit={handleRequestEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-email">Atualizar email</Label>
            <Input
              id="account-email"
              type="email"
              value={emailDraft}
              onChange={(event) => setEmailDraft(event.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending
              ? 'Enviando confirmacao...'
              : 'Enviar link de confirmacao'}
          </Button>
        </form>

        {updateProfile.isError ? (
          <p className="text-sm text-destructive">
            {updateProfile.error.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
