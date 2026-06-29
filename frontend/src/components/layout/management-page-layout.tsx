import type { ReactNode } from 'react';

export function ManagementPageLayout({
  children,
  title,
}: {
  children: ReactNode;
  title?: string; //
}) {
  return (
    <div className="mx-auto flex w-full max-w-300 flex-1 flex-col space-y-8 p-8">
      {title && <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>}
      {children}
    </div>
  );
}
