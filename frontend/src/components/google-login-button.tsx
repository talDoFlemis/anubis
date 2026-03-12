import { GoogleLogin } from '@react-oauth/google';
import { useGoogleLogin } from '@/hooks/use-auth';
import { toast } from 'sonner';

export function GoogleLoginButton() {
  const googleLoginMutation = useGoogleLogin();

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          const idToken = credentialResponse.credential;
          if (!idToken) {
            toast.error('Nao foi possivel obter o token do Google.');
            return;
          }
          googleLoginMutation.mutate({ idToken });
        }}
        onError={() => {
          toast.error('Erro ao iniciar login com Google.');
        }}
        width="100%"
        text="signin_with"
      />
    </div>
  );
}
