import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { GoogleLoginButton } from '@/components/google-login-button';
import {
  useLinkEmailProvider,
  useLinkGoogleProvider,
  useUpdateProfile,
} from '@/hooks/use-auth';
import { formatProviderLabel, type User, type UserOwnedEmail } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AccountAccessCardProps {
  user: User;
}

export function AccountAccessCard({ user }: AccountAccessCardProps) {
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedOwnedEmailAccountId, setSelectedOwnedEmailAccountId] =
    useState('primary');
  const updateProfile = useUpdateProfile();
  const linkEmailProvider = useLinkEmailProvider();
  const linkGoogleProvider = useLinkGoogleProvider();

  const hasEmailProvider = user.linkedProviders.includes('email');
  const hasGoogleProvider = user.linkedProviders.includes('google');
  const proofProvider = user.linkedProviders.find(
    (provider) => provider !== 'email',
  );
  const resolvedEmail = emailDraft ?? user.email ?? '';
  const ownedEmailOptions =
    user.ownedEmails?.filter((ownedEmail): ownedEmail is UserOwnedEmail =>
      Boolean(ownedEmail.email),
    ) ?? [];
  const primaryOwnedEmail = ownedEmailOptions.find(
    (ownedEmail) => ownedEmail.isPrimary,
  );
  const secondaryOwnedEmails = ownedEmailOptions.filter(
    (ownedEmail) => !ownedEmail.isPrimary && ownedEmail.accountId,
  );
  const selectableOwnedEmails = [
    ...(primaryOwnedEmail || user.email
      ? [
          primaryOwnedEmail ?? {
            accountId: null,
            email: user.email ?? '',
            isPrimary: true,
          },
        ]
      : []),
    ...secondaryOwnedEmails,
  ];
  const hasExplicitOwnedEmailChoice = secondaryOwnedEmails.some(
    (ownedEmail) => !ownedEmail.isPrimary && ownedEmail.accountId,
  );

  useEffect(() => {
    setSelectedOwnedEmailAccountId('primary');
  }, [user.id, user.updatedAt]);

  const handleRequestEmail = (event: React.FormEvent) => {
    event.preventDefault();

    if (!resolvedEmail) {
      toast.error('Informe um email para receber o link de confirmacao.');
      return;
    }

    updateProfile.mutate(
      { email: resolvedEmail },
      {
        onSuccess: () => {
          toast.success(
            `Enviamos um link para confirmar ${resolvedEmail} antes de vincular email e senha.`,
          );
        },
      },
    );
  };

  const handleLinkGoogle = (idToken: string) => {
    if (linkGoogleProvider.isPending) {
      return;
    }

    linkGoogleProvider.mutate(
      { idToken },
      {
        onSuccess: () => {
          toast.success('Google vinculado com sucesso.');
        },
      },
    );
  };

  const handleLinkEmail = (providerToken: string) => {
    if (!password || !confirmPassword) {
      toast.error('Informe e confirme uma senha para vincular email e senha.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas nao coincidem.');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (!proofProvider) {
      toast.error('Nenhum provedor disponivel para confirmar a vinculacao.');
      return;
    }

    linkEmailProvider.mutate(
      {
        password,
        provider: proofProvider,
        providerToken,
        ownedEmailAccountId:
          selectedOwnedEmailAccountId === 'primary'
            ? undefined
            : selectedOwnedEmailAccountId,
      },
      {
        onSuccess: () => {
          toast.success('Email e senha vinculados com sucesso.');
          setPassword('');
          setConfirmPassword('');
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Acesso e provedores</CardTitle>
        <CardDescription>
          Gerencie as formas de entrada disponiveis para esta conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Provedores vinculados
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {user.linkedProviders.map((provider) => (
                <Badge key={provider} variant="secondary">
                  {formatProviderLabel(provider)}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email atual</p>
            <p className="font-medium">{user.email ?? 'Nao informado'}</p>
          </div>
        </div>

        {!user.email ? (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-1">
              <p className="font-medium">Definir email da conta</p>
              <p className="text-sm text-muted-foreground">
                Adicione um email valido para receber a confirmacao e liberar a
                vinculacao de email e senha.
              </p>
            </div>

            <form onSubmit={handleRequestEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-email">Email</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={resolvedEmail}
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
          </div>
        ) : null}

        {!hasGoogleProvider ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="space-y-1">
              <p className="font-medium">Adicionar Google</p>
              <p className="text-sm text-muted-foreground">
                Vincule sua conta Google para entrar tambem com esse provedor.
              </p>
            </div>

            <GoogleLoginButton
              text="continue_with"
              helperText="Use a conta Google que deseja manter vinculada ao seu acesso."
              onIdToken={handleLinkGoogle}
            />

            {linkGoogleProvider.isError ? (
              <p className="text-sm text-destructive">
                {linkGoogleProvider.error.message}
              </p>
            ) : null}
          </div>
        ) : null}

        {!hasEmailProvider ? (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-1">
              <p className="font-medium">Adicionar email e senha</p>
              <p className="text-sm text-muted-foreground">
                Defina uma senha e confirme a vinculacao com o provedor atual.
              </p>
            </div>

            {!user.email ? (
              <p className="text-sm text-muted-foreground">
                Depois de confirmar o email acima, volte aqui para concluir a
                vinculacao de email e senha.
              </p>
            ) : proofProvider === 'google' ? (
              <div className="space-y-4">
                {hasExplicitOwnedEmailChoice ? (
                  <div className="space-y-2">
                    <Label>Escolha qual email usar com a senha</Label>
                    <div className="space-y-2">
                      {selectableOwnedEmails.map((ownedEmail) => {
                        const optionValue = ownedEmail.isPrimary
                          ? 'primary'
                          : (ownedEmail.accountId ?? ownedEmail.email);
                        const isSelected =
                          selectedOwnedEmailAccountId === optionValue;

                        return (
                          <label
                            key={optionValue}
                            className={cn(
                              'flex cursor-pointer items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm transition-colors',
                              isSelected
                                ? 'border-primary bg-accent'
                                : 'hover:bg-accent/50',
                            )}
                          >
                            <div className="space-y-1">
                              <span className="font-medium">
                                {ownedEmail.email}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {ownedEmail.isPrimary
                                  ? 'Email principal atual'
                                  : 'Email adicional verificado'}
                              </p>
                            </div>
                            <input
                              type="radio"
                              name="owned-email-account"
                              className="mt-1"
                              checked={isSelected}
                              onChange={() =>
                                setSelectedOwnedEmailAccountId(optionValue)
                              }
                            />
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Selecione explicitamente o email que deve ficar associado
                      ao acesso por senha.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="link-password">Nova senha</Label>
                  <Input
                    id="link-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    placeholder="Minimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-confirm-password">Confirmar senha</Label>
                  <Input
                    id="link-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={6}
                    placeholder="Repita a nova senha"
                  />
                </div>

                <GoogleLoginButton
                  text="continue_with"
                  helperText="Depois de definir a senha, confirme com Google para concluir a vinculacao."
                  onIdToken={handleLinkEmail}
                />
              </div>
            ) : proofProvider ? (
              <p className="text-sm text-muted-foreground">
                Entre novamente com {formatProviderLabel(proofProvider)} para
                concluir a vinculacao de email e senha.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum provedor social esta disponivel para confirmar esta
                vinculacao.
              </p>
            )}

            {linkEmailProvider.isError ? (
              <p className="text-sm text-destructive">
                {linkEmailProvider.error.message}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border p-4">
            <p className="font-medium">Email e senha ja vinculados</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Voce pode usar email e senha como metodo adicional de acesso.
            </p>
          </div>
        )}

        <Button variant="outline" disabled>
          {user.linkedProviders.length} metodo(s) de acesso ativo(s)
        </Button>
      </CardContent>
    </Card>
  );
}
