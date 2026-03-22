import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useConfirmNewEmail } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle } from 'lucide-react';

interface ConfirmNewEmailSearch {
  hash: string;
}

export const Route = createFileRoute('/auth/confirm-new-email')({
  validateSearch: (search: Record<string, unknown>): ConfirmNewEmailSearch => ({
    hash: (search.hash as string) || '',
  }),
  component: ConfirmNewEmailPage,
});

function ConfirmNewEmailPage() {
  const { hash } = Route.useSearch();
  const confirmNewEmail = useConfirmNewEmail();
  const navigate = useNavigate();

  useEffect(() => {
    if (hash) {
      confirmNewEmail.mutate({ hash });
    }
  }, [hash]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hash) {
    return (
      <Card>
        <CardHeader className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <CardTitle className="text-2xl">Link invalido</CardTitle>
          <CardDescription>
            O link de confirmacao nao e valido ou expirou.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/auth/sign-in' })}
          >
            Ir para o login
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (confirmNewEmail.isPending) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Confirmando novo email...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (confirmNewEmail.isError) {
    return (
      <Card>
        <CardHeader className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <CardTitle className="text-2xl">Erro na confirmacao</CardTitle>
          <CardDescription>{confirmNewEmail.error.message}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button variant="outline" onClick={() => navigate({ to: '/' })}>
            Voltar ao inicio
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <CardTitle className="text-2xl">Email atualizado!</CardTitle>
        <CardDescription>
          Seu novo email foi confirmado com sucesso.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Link to="/">
          <Button>Voltar ao inicio</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
