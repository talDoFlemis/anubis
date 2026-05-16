import {
  AuthCallout,
  AuthErrorMessage,
  AuthPageLayout,
  EmailField,
  PasswordField,
  SubmitButton,
} from '@/components/auth';
import { Button } from '@/components/ui/button';
import {
  forgotPasswordSchema,
  professorOnboardingSchema,
  type ProfessorOnboardingFormData,
} from '@/features/auth/auth-form.schemas';
import { useCompleteProfessorOnboarding, useResendProfessorOnboarding } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';
import { AUTH_SIGN_IN_ROUTE, validateHashSearch } from '@/lib/auth-flow';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/onboarding/professor')({
  validateSearch: validateHashSearch,
  component: ProfessorOnboardingPage,
});

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

function ProfessorOnboardingPage() {
  const { hash } = Route.useSearch();
  const completeOnboarding = useCompleteProfessorOnboarding();
  const navigate = useNavigate();
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

  const isExpiredError =
    completeOnboarding.isError &&
    completeOnboarding.error instanceof ApiError &&
    completeOnboarding.error.status >= 400 &&
    completeOnboarding.error.status < 500;

  if (!hash || isExpiredError) {
    return <ExpiredLinkPage />;
  }

  return (
    <AuthPageLayout
      eyebrow="Ativacao"
      title="Ative sua Conta"
      description="Crie uma senha segura com no minimo 8 caracteres."
      compact
    >
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
          label="Ativar Conta"
          pendingLabel="Ativando..."
        />
      </form>
    </AuthPageLayout>
  );
}
