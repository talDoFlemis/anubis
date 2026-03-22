import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useConfirmEmail } from '@/hooks/use-auth';
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

interface ConfirmEmailSearch {
  hash: string;
}

export const Route = createFileRoute('/auth/confirm-email')({
  validateSearch: (search: Record<string, unknown>): ConfirmEmailSearch => ({
    hash: (search.hash as string) || '',
  }),
  component: ConfirmEmailPage,
});

function ConfirmEmailPage() {
  const { hash } = Route.useSearch();
  const confirmEmail = useConfirmEmail();
  const navigate = useNavigate();

  useEffect(() => {
    if (hash) {
      confirmEmail.mutate({ hash });
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

  if (confirmEmail.isPending) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Confirmando email...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (confirmEmail.isError) {
    return (
      <Card>
        <CardHeader className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <CardTitle className="text-2xl">Erro na confirmacao</CardTitle>
          <CardDescription>{confirmEmail.error.message}</CardDescription>
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

  return (
    <Card>
      <CardHeader className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <CardTitle className="text-2xl">Email confirmado!</CardTitle>
        <CardDescription>
          Sua conta foi ativada com sucesso. Voce ja pode fazer login.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Link to="/auth/sign-in">
          <Button>Ir para o login</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
