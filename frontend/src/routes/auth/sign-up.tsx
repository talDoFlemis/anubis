import {
  AuthCallout,
  AuthErrorMessage,
  AuthPageLayout,
  EmailField,
  OAuthDivider,
  PasswordField,
  SubmitButton,
} from '@/components/auth';
import { GoogleLoginButton } from '@/components/google-login-button';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { signUpSchema, type SignUpFormData } from '@/features/auth/auth-form.schemas';
import { useEmailRegister } from '@/hooks/use-auth';
import { AUTH_SIGN_IN_ROUTE } from '@/lib/auth-flow';
import { toFieldErrors } from '@/shared/errors/fieldErrors';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/sign-up')({
  component: SignUpPage,
});

function SignUpPage() {
  const register = useEmailRegister();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      cpf: '',
      universityOfOrigin: '',
      ira: '',
      email: '',
      password: '',
    } satisfies SignUpFormData,
    validators: { onSubmit: signUpSchema },
    onSubmit: async ({ value }) => {
      register.mutate(value, {
        onSuccess: () => {
          toast.success('Conta criada! Verifique seu email para confirmar o cadastro.');
          navigate({ to: AUTH_SIGN_IN_ROUTE });
        },
      });
    },
  });

  return (
    <AuthPageLayout
      eyebrow="Sistema de Seleção MDCC"
      title="Criar conta"
      description="Preencha seus dados para iniciar a candidatura."
      footer={
        <>
          Ja possui acesso?{' '}
          <Link to={AUTH_SIGN_IN_ROUTE} className="text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
          .
        </>
      }
    >
      <AuthCallout
        title="Docentes"
        description="cadastro de docentes deve ser feito por um administrador. entre em contato com o suporte para obter ajuda."
      />
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
                      placeholder="Seu nome"
                      value={field.state.value}
                      onChange={event => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={isInvalid}
                      required
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
                      placeholder="Seu sobrenome"
                      value={field.state.value}
                      onChange={event => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={isInvalid}
                      required
                    />
                    <FieldError errors={fieldErrors} />
                  </FieldContent>
                </Field>
              );
            }}
          </form.Field>
        </div>

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

        <div className="grid gap-5 sm:grid-cols-2">
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
                      placeholder="Somente numeros"
                      value={field.state.value}
                      onChange={event => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={isInvalid}
                      required
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
                  <FieldLabel htmlFor={field.name}>Universidade</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      placeholder="Ex.: UFRN"
                      value={field.state.value}
                      onChange={event => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={isInvalid}
                      required
                    />
                    <FieldError errors={fieldErrors} />
                  </FieldContent>
                </Field>
              );
            }}
          </form.Field>
        </div>

        <form.Field name="ira">
          {field => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            const fieldErrors = toFieldErrors(field.state.meta.errors);

            return (
              <Field data-invalid={isInvalid} className="space-y-2">
                <FieldLabel htmlFor={field.name}>IRA</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    inputMode="decimal"
                    placeholder="Ex.: 8.75"
                    value={field.state.value}
                    onChange={event => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                    required
                  />
                  <FieldError errors={fieldErrors} />
                </FieldContent>
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="password">
          {field => (
            <PasswordField
              id="password"
              label="Senha"
              value={field.state.value}
              onChange={value => field.handleChange(value)}
              onBlur={field.handleBlur}
              placeholder="Minimo 6 caracteres"
              minLength={6}
              errors={field.state.meta.errors}
              isInvalid={field.state.meta.isTouched && !field.state.meta.isValid}
            />
          )}
        </form.Field>

        <AuthErrorMessage message={register.isError ? register.error.message : null} />

        <SubmitButton
          isPending={register.isPending}
          label="Criar conta"
          pendingLabel="Criando conta..."
        />
      </form>

      <OAuthDivider label="alternativa institucional" />

      <AuthCallout
        title="Iniciar com Google"
        description="Use a conta que pretende manter vinculada ao acompanhamento do processo seletivo."
      >
        <GoogleLoginButton
          text="signup_with"
          helperText="Quem continuar com Google pode precisar completar os dados de candidato logo apos a autenticacao."
        />
      </AuthCallout>
    </AuthPageLayout>
  );
}
