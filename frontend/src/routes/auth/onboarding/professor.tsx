import {
  AuthCallout,
  AuthErrorMessage,
  AuthPageLayout,
  EmailField,
  PasswordField,
  SubmitButton,
} from '@/components/auth';
import { GoogleLoginButton } from '@/components/google-login-button';
import { Button } from '@/components/ui/button';
import {
  forgotPasswordSchema,
  professorOnboardingSchema,
  type ProfessorOnboardingFormData,
} from '@/features/auth/auth-form.schemas';
import {
  useCompleteGoogleOnboarding,
  useCompleteProfessorOnboarding,
  useResendProfessorOnboarding,
  useVerifyOnboardingToken,
} from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';
import { AUTH_SIGN_IN_ROUTE, validateHashSearch } from '@/lib/auth-flow';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/onboarding/professor')({
  validateSearch: validateHashSearch,
  component: ProfessorOnboardingPage,
});

function AlreadyActivatedPage() {
  const navigate = useNavigate();

  return (
    <AuthPageLayout
      eyebrow="Ativacao"
      title="Conta Ja Ativada"
      description="Sua conta ja foi ativada anteriormente. Faca login para acessar o sistema."
      compact
      status={
        <AuthCallout
          title="Conta ja ativada"
          description="Sua conta ja foi configurada com sucesso. Use suas credenciais para acessar o sistema."
          className="bg-[rgba(26,120,60,0.08)]"
        >
          <CheckCircle2 className="text-green-600 h-5 w-5" />
        </AuthCallout>
      }
    >
      <Button className="w-full" onClick={() => navigate({ to: AUTH_SIGN_IN_ROUTE })}>
        Ir para o login
      </Button>
    </AuthPageLayout>
  );
}

function ExpiredLinkPage() {
  const navigate = useNavigate();
  const [showResendForm, setShowResendForm] = useState(false);
  const resendOnboarding = useResendProfessorOnboarding();
  const form = useForm({
    defaultValues: { email: '' },
    validators: { onSubmit: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      resendOnboarding.mutate(value, {
        onSuccess: () => {
          toast.success('Novo link enviado! Verifique sua caixa de entrada.');
          setShowResendForm(false);
        },
      });
    },
  });

  if (showResendForm) {
    return (
      <AuthPageLayout
        eyebrow="Reenviar Link"
        title="Solicitar Novo Link"
        description="Informe seu email para receber um novo link de ativacao."
        compact
      >
        <form
          onSubmit={event => {
            event.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-5"
        >
          <form.Field name="email">
            {field => (
              <EmailField
                value={field.state.value}
                onChange={value => field.handleChange(value)}
                onBlur={field.handleBlur}
                errors={field.state.meta.errors}
                isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
              />
            )}
          </form.Field>

          <AuthErrorMessage
            message={resendOnboarding.isError ? resendOnboarding.error.message : null}
          />

          <div className="flex flex-col gap-3">
            <SubmitButton
              isPending={resendOnboarding.isPending}
              label="Enviar Link"
              pendingLabel="Enviando..."
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowResendForm(false)}
              disabled={resendOnboarding.isPending}
              type="button"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      eyebrow="Ativacao"
      title="Link de Ativacao Expirado"
      description="Por seguranca, o acesso expira apos o primeiro uso ou depois de um periodo limitado."
      compact
      status={
        <AuthCallout
          title="Link de ativacao expirado"
          description="Solicite um novo envio com a secretaria ou retorne ao login para iniciar novamente."
          className="bg-[rgba(186,26,26,0.08)]"
        >
          <XCircle className="text-destructive h-5 w-5" />
        </AuthCallout>
      }
    >
      <div className="flex flex-col gap-3">
        <Button className="w-full" onClick={() => setShowResendForm(true)}>
          Solicitar novo link
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate({ to: AUTH_SIGN_IN_ROUTE })}
        >
          Voltar ao login
        </Button>
      </div>
    </AuthPageLayout>
  );
}

function LoadingPage() {
  return (
    <AuthPageLayout
      eyebrow="Ativacao"
      title="Verificando link..."
      description="Aguarde enquanto verificamos seu link de ativacao."
      compact
    >
      <div className="flex justify-center py-8">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    </AuthPageLayout>
  );
}

function ProfessorOnboardingPage() {
  const { hash } = Route.useSearch();
  const verifyToken = useVerifyOnboardingToken();
  const completeOnboarding = useCompleteProfessorOnboarding();
  const googleOnboarding = useCompleteGoogleOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    if (hash) {
      verifyToken.mutate({ hash });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);

  const form = useForm({
    defaultValues: { password: '', confirmPassword: '' } satisfies ProfessorOnboardingFormData,
    validators: { onSubmit: professorOnboardingSchema },
    onSubmit: async ({ value }) => {
      completeOnboarding.mutate(
        { hash, password: value.password },
        {
          onSuccess: () => {
            navigate({ to: AUTH_SIGN_IN_ROUTE });
          },
        },
      );
    },
  });

  const isAlreadyActivated =
    (verifyToken.isError &&
      verifyToken.error instanceof ApiError &&
      verifyToken.error.status === 409) ||
    (completeOnboarding.isError &&
      completeOnboarding.error instanceof ApiError &&
      completeOnboarding.error.status === 409) ||
    (googleOnboarding.isError &&
      googleOnboarding.error instanceof ApiError &&
      googleOnboarding.error.status === 409);

  const isExpiredError =
    (verifyToken.isError &&
      verifyToken.error instanceof ApiError &&
      verifyToken.error.status >= 400 &&
      verifyToken.error.status < 500 &&
      verifyToken.error.status !== 409) ||
    (completeOnboarding.isError &&
      completeOnboarding.error instanceof ApiError &&
      completeOnboarding.error.status >= 400 &&
      completeOnboarding.error.status < 500 &&
      completeOnboarding.error.status !== 409);

  if (!hash) {
    return <ExpiredLinkPage />;
  }

  if (verifyToken.isPending) {
    return <LoadingPage />;
  }

  if (isAlreadyActivated) {
    return <AlreadyActivatedPage />;
  }

  if (isExpiredError) {
    return <ExpiredLinkPage />;
  }

  const googleError =
    googleOnboarding.isError && googleOnboarding.error instanceof ApiError
      ? googleOnboarding.error.message
      : null;

  return (
    <AuthPageLayout
      eyebrow="Ativacao"
      title="Ative sua Conta"
      description="Escolha como deseja ativar sua conta: crie uma senha ou use o Google."
      compact
    >
      <div className="space-y-5">
        <GoogleLoginButton
          text="signin_with"
          onIdToken={idToken => {
            googleOnboarding.mutate(
              { hash, idToken },
              {
                onSuccess: () => {
                  toast.success('Conta ativada com Google!');
                  navigate({ to: AUTH_SIGN_IN_ROUTE });
                },
                onError: error => {
                  if (error instanceof ApiError && error.status === 409) {
                    return;
                  }
                  toast.error(error.message);
                },
              },
            );
          }}
          helperText="Use a mesma conta Google associada ao email do convite."
        />

        <AuthErrorMessage message={googleError} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background text-muted-foreground px-2">ou crie uma senha</span>
          </div>
        </div>

        <form
          onSubmit={event => {
            event.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-5"
        >
          <form.Field name="password">
            {field => (
              <PasswordField
                id="password"
                label="Nova Senha"
                value={field.state.value}
                onChange={value => field.handleChange(value)}
                onBlur={field.handleBlur}
                placeholder="Minimo 8 caracteres"
                minLength={8}
                errors={field.state.meta.errors}
                isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
              />
            )}
          </form.Field>

          <form.Field name="confirmPassword">
            {field => (
              <PasswordField
                id="confirmPassword"
                label="Confirmar Nova Senha"
                value={field.state.value}
                onChange={value => field.handleChange(value)}
                onBlur={field.handleBlur}
                placeholder="Repita a nova senha"
                minLength={8}
                errors={field.state.meta.errors}
                isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
              />
            )}
          </form.Field>

          <AuthErrorMessage
            message={completeOnboarding.isError ? completeOnboarding.error.message : null}
          />

          <SubmitButton
            isPending={completeOnboarding.isPending}
            label="Ativar com Senha"
            pendingLabel="Ativando..."
          />
        </form>
      </div>
    </AuthPageLayout>
  );
}
