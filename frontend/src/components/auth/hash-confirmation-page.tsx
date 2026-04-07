import { Link, useNavigate } from '@tanstack/react-router';
import { CheckCircle, LoaderCircle, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { AuthCallout, AuthPageLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';

interface HashConfirmationConfig {
  eyebrow: string;
  invalidHash: {
    title: string;
    description: string;
    calloutTitle: string;
    calloutDescription: string;
  };
  pending: {
    title: string;
    description: string;
    calloutTitle: string;
    calloutDescription: string;
  };
  error: {
    title: string;
    description: string;
    calloutTitle: string;
  };
  success: {
    title: string;
    description: string;
    calloutTitle: string;
    calloutDescription: string;
  };
  successEyebrow: string;
  successAction: { label: string; to: string };
  errorAction: { label: string; to: string };
}

interface HashConfirmationPageProps {
  hash: string;
  mutation: UseMutationResult<void, Error, { hash: string }>;
  config: HashConfirmationConfig;
}

export function HashConfirmationPage({
  hash,
  mutation,
  config,
}: HashConfirmationPageProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (hash) {
      mutation.mutate({ hash });
    }
  }, [hash]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hash) {
    return (
      <AuthPageLayout
        eyebrow={config.eyebrow}
        title={config.invalidHash.title}
        description={config.invalidHash.description}
        compact
        status={
          <AuthCallout
            title={config.invalidHash.calloutTitle}
            description={config.invalidHash.calloutDescription}
            className="bg-[rgba(186,26,26,0.08)]"
          >
            <XCircle className="h-5 w-5 text-destructive" />
          </AuthCallout>
        }
        footer={
          <Button
            variant="outline"
            onClick={() => navigate({ to: config.errorAction.to })}
          >
            {config.errorAction.label}
          </Button>
        }
      >
        <div />
      </AuthPageLayout>
    );
  }

  if (mutation.isPending) {
    return (
      <AuthPageLayout
        eyebrow={config.eyebrow}
        title={config.pending.title}
        description={config.pending.description}
        compact
        status={
          <AuthCallout
            title={config.pending.calloutTitle}
            description={config.pending.calloutDescription}
          >
            <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          </AuthCallout>
        }
      >
        <div />
      </AuthPageLayout>
    );
  }

  if (mutation.isError) {
    return (
      <AuthPageLayout
        eyebrow={config.eyebrow}
        title={config.error.title}
        description={config.error.description}
        compact
        status={
          <AuthCallout
            title={config.error.calloutTitle}
            description={mutation.error.message}
            className="bg-[rgba(186,26,26,0.08)]"
          >
            <XCircle className="h-5 w-5 text-destructive" />
          </AuthCallout>
        }
        footer={
          <Button
            variant="outline"
            onClick={() => navigate({ to: config.errorAction.to })}
          >
            {config.errorAction.label}
          </Button>
        }
      >
        <div />
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      eyebrow={config.successEyebrow}
      title={config.success.title}
      description={config.success.description}
      compact
      status={
        <AuthCallout
          title={config.success.calloutTitle}
          description={config.success.calloutDescription}
        >
          <CheckCircle className="h-5 w-5 text-primary" />
        </AuthCallout>
      }
      footer={
        <Button asChild>
          <Link to={config.successAction.to}>{config.successAction.label}</Link>
        </Button>
      }
    >
      <div />
    </AuthPageLayout>
  );
}
