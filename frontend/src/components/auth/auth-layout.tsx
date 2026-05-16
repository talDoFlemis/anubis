import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AuthPageLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  status?: ReactNode;
  compact?: boolean;
}

export function AuthPageLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
  status,
  compact = false,
}: AuthPageLayoutProps) {
  return (
    <div className="anubis-page-shell min-h-svh px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-7xl items-center justify-center">
        <section className="flex items-center justify-center">
          <Card className={cn('w-full max-w-xl rounded-4xl', compact ? 'max-w-lg' : '')}>
            <CardContent className="space-y-8 p-7 sm:p-9">
              <div className="space-y-4">
                <p className="font-label text-primary">{eyebrow}</p>
                <div className="space-y-3">
                  <h2 className="text-foreground font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-[2.7rem]">
                    {title}
                  </h2>
                  <p className="text-muted-foreground max-w-2xl text-sm leading-7 sm:text-base">
                    {description}
                  </p>
                </div>
              </div>

              {status}

              {children}

              {footer ? (
                <div className="text-muted-foreground border-t border-transparent pt-1 text-sm leading-6">
                  {footer}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

export function AuthCallout({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('anubis-surface-muted space-y-3 rounded-3xl p-5', className)}>
      <div className="space-y-1">
        <p className="text-foreground font-serif text-xl">{title}</p>
        {description ? (
          <p className="text-muted-foreground text-sm leading-6">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function AuthErrorMessage({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="text-destructive rounded-[1.25rem] bg-[rgba(186,26,26,0.08)] px-4 py-3 text-sm">
      {message}
    </div>
  );
}

export function AuthHelperText({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground text-sm leading-6">{children}</p>;
}
