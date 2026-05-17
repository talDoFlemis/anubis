import type { ReactNode } from 'react';

type HomeShellProps = {
  children: ReactNode;
};

export function HomeShell({ children }: HomeShellProps) {
  return (
    <div className="anubis-page-shell min-h-svh px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="relative z-10 mx-auto max-w-7xl space-y-6">{children}</div>
    </div>
  );
}
