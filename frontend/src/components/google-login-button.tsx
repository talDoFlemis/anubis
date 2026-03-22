import type { ComponentProps } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleLogin } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface GoogleLoginButtonProps {
  helperText?: string;
  onIdToken?: (idToken: string) => void;
  text?: ComponentProps<typeof GoogleLogin>['text'];
}

export function GoogleLoginButton({
  helperText,
  onIdToken,
  text = 'signin_with',
}: GoogleLoginButtonProps) {
  const googleLoginMutation = useGoogleLogin();

  return (
    <div className="space-y-2">
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            const idToken = credentialResponse.credential;
            if (!idToken) {
              toast.error('Nao foi possivel obter o token do Google.');
              return;
            }

            if (onIdToken) {
              onIdToken(idToken);
              return;
            }

            googleLoginMutation.mutate(
              { idToken },
              {
                onError: (error) => {
                  toast.error(error.message);
                },
              },
            );
          }}
          onError={() => {
            toast.error('Erro ao iniciar login com Google.');
          }}
          width="100%"
          text={text}
        />
      </div>
      {helperText ? (
        <p className="text-center text-xs text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
