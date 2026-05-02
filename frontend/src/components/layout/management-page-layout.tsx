import type { ReactNode } from 'react';

export function ManagementPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-300 flex-1 flex-col space-y-8 p-8">{children}</div>
  );
}
