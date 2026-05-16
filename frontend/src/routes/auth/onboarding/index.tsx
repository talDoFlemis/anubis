import { AuthCallout, AuthErrorMessage, AuthPageLayout, SubmitButton } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { onboardingSchema, type OnboardingFormData } from '@/features/auth/auth-form.schemas';
import { useAuth, useCompleteCandidateOnboarding, useLogout } from '@/hooks/use-auth';
import { getPostAuthPath } from '@/lib/auth-flow';
import { toFieldErrors } from '@/shared/errors/fieldErrors';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/onboarding/')({
  component: CandidateOnboardingPage,
});

function CandidateOnboardingPage() {
  const { data: user } = useAuth();
  const onboarding = useCompleteCandidateOnboarding();
  const logout = useLogout();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      cpf: user?.cpf ?? '',
      universityOfOrigin: '',
      ira: '',
      poscomp: '',
    } satisfies OnboardingFormData,
    validators: { onSubmit: onboardingSchema },
    onSubmit: async ({ value }) => {
      onboarding.mutate(
        {
          firstName: value.firstName,
          lastName: value.lastName,
          cpf: value.cpf,
          universityOfOrigin: value.universityOfOrigin,
          ira: value.ira.trim() || undefined,
          poscomp: value.poscomp.trim() ? Number(value.poscomp) : undefined,
        },
        {
          onSuccess: updatedUser => {
            toast.success('Cadastro concluido com sucesso.');
            navigate({ to: getPostAuthPath(updatedUser) });
          },
        },
      );
    },
  });

  return (
    <AuthPageLayout
      eyebrow="Concluir cadastro"
      title="Feche seu perfil academico antes de entrar na area do candidato."
      description="Precisamos registrar os dados complementares do candidato para liberar o acompanhamento do processo e personalizar as proximas etapas."
      compact
    >
      <form
        onSubmit={event => {
          event.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <form.Field name="firstName">
            {field => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const fieldErrors = toFieldErrors(field.state.meta.errors);

              return (
                <Field data-invalid={isInvalid} className="space-y-2">
                  <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={event => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Seu nome"
                      required
                      aria-invalid={isInvalid}
                    />
                    <FieldError errors={fieldErrors} />
                  </FieldContent>
                </Field>
              );
            }}
          </form.Field>
          <form.Field name="lastName">
            {field => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const fieldErrors = toFieldErrors(field.state.meta.errors);

              return (
                <Field data-invalid={isInvalid} className="space-y-2">
                  <FieldLabel htmlFor={field.name}>Sobrenome</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={event => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Seu sobrenome"
                      required
                      aria-invalid={isInvalid}
                    />
                    <FieldError errors={fieldErrors} />
                  </FieldContent>
                </Field>
              );
            }}
          </form.Field>
        </div>

        <form.Field name="cpf">
          {field => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            const fieldErrors = toFieldErrors(field.state.meta.errors);

            return (
              <Field data-invalid={isInvalid} className="space-y-2">
                <FieldLabel htmlFor={field.name}>CPF</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    inputMode="numeric"
                    value={field.state.value}
                    onChange={event => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Somente numeros"
                    required
                    aria-invalid={isInvalid}
                  />
                  <FieldError errors={fieldErrors} />
                </FieldContent>
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="universityOfOrigin">
          {field => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            const fieldErrors = toFieldErrors(field.state.meta.errors);

            return (
              <Field data-invalid={isInvalid} className="space-y-2">
                <FieldLabel htmlFor={field.name}>Universidade de origem</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={event => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Ex.: UFRN"
                    required
                    aria-invalid={isInvalid}
                  />
                  <FieldError errors={fieldErrors} />
                </FieldContent>
              </Field>
            );
          }}
        </form.Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <form.Field name="ira">
            {field => (
              <Field className="space-y-2">
                <FieldLabel htmlFor={field.name}>IRA (opcional)</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    inputMode="decimal"
                    value={field.state.value}
                    onChange={event => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Ex.: 8.75"
                  />
                </FieldContent>
              </Field>
            )}
          </form.Field>
          <form.Field name="poscomp">
            {field => (
              <Field className="space-y-2">
                <FieldLabel htmlFor={field.name}>POSCOMP (opcional)</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    inputMode="numeric"
                    value={field.state.value}
                    onChange={event => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Ex.: 780"
                  />
                </FieldContent>
              </Field>
            )}
          </form.Field>
        </div>

        <AuthErrorMessage message={onboarding.isError ? onboarding.error.message : null} />

        <SubmitButton
          isPending={onboarding.isPending}
          label="Concluir cadastro"
          pendingLabel="Salvando..."
        />
      </form>

      <AuthCallout
        title="Precisa trocar de conta?"
        description="Saia agora para reiniciar a autenticacao com outro perfil antes de gravar os dados de candidato."
      >
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          {logout.isPending ? 'Saindo...' : 'Sair desta conta'}
        </Button>
      </AuthCallout>
    </AuthPageLayout>
  );
}
