import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AuthAsideMetric {
  label: string;
  value: string;
}

interface AuthPageLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  asideTitle?: string;
  asideDescription?: string;
  metrics?: AuthAsideMetric[];
  notes?: string[];
  status?: ReactNode;
  compact?: boolean;
}

export function AuthPageLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
  asideTitle,
  asideDescription,
  metrics = [],
  notes = [],
  status,
  compact = false,
}: AuthPageLayoutProps) {
  return (
    <div className="anubis-page-shell min-h-svh px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-7xl items-center">
        <div className="anubis-editorial-grid relative z-10 w-full">
          <section className="anubis-glass anubis-ghost-border anubis-card-shadow hidden rounded-[2rem] p-8 lg:flex lg:min-h-[42rem] lg:flex-col lg:justify-between lg:p-10">
            <div className="space-y-8">
              <div className="space-y-5">
                <p className="font-label text-primary">Plataforma Anubis</p>
                <div className="space-y-4">
                  <h1 className="font-serif text-4xl leading-tight tracking-[-0.03em] text-foreground xl:text-5xl">
                    {asideTitle ??
                      'Curadoria academica para jornadas de ingresso.'}
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-muted-foreground">
                    {asideDescription ??
                      'Uma experiencia editorial para organizar etapas, documentos e prazos com clareza, calma e prioridade.'}
                  </p>
                </div>
              </div>

              {metrics.length ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  {metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="anubis-surface-muted rounded-[1.5rem] p-5"
                    >
                      <p className="font-label text-muted-foreground">
                        {metric.label}
                      </p>
                      <p className="mt-3 font-serif text-3xl text-foreground">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {notes.length ? (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note}
                      className="anubis-surface-stack rounded-[1.35rem] px-5 py-4 text-sm leading-6 text-muted-foreground"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <section className="flex items-center justify-center">
            <Card
              className={cn(
                'w-full max-w-xl rounded-[2rem]',
                compact ? 'max-w-lg' : '',
              )}
            >
              <CardContent className="space-y-8 p-7 sm:p-9">
                <div className="space-y-4">
                  <p className="font-label text-primary">{eyebrow}</p>
                  <div className="space-y-3">
                    <h2 className="font-serif text-4xl leading-tight tracking-[-0.03em] text-foreground sm:text-[2.7rem]">
                      {title}
                    </h2>
                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                      {description}
                    </p>
                  </div>
                </div>

                {status}

                {children}

                {footer ? (
                  <div className="border-t border-transparent pt-1 text-sm leading-6 text-muted-foreground">
                    {footer}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </section>
        </div>
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
    <div
      className={cn(
        'anubis-surface-muted space-y-3 rounded-[1.5rem] p-5',
        className,
      )}
    >
      <div className="space-y-1">
        <p className="font-serif text-xl text-foreground">{title}</p>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
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
    <div className="rounded-[1.25rem] bg-[rgba(186,26,26,0.08)] px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}

export function AuthHelperText({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-6 text-muted-foreground">{children}</p>;
}
