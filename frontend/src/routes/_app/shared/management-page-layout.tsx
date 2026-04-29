import type { ReactNode } from 'react';

import { ManagementTopNav } from '@/components/management-top-nav';
import { useAuth } from '@/hooks/use-auth';

type ManagementTabKey = 'overview' | 'professors' | 'applications' | 'research-topics';

interface ManagementTab {
  key: ManagementTabKey;
  label: string;
  href: string;
}

const MANAGEMENT_TABS: ManagementTab[] = [
  {
    key: 'overview',
    label: 'Visão geral',
    href: '/',
  },
  {
    key: 'professors',
    label: 'Professores',
    href: '/professors/',
  },
  {
    key: 'applications',
    label: 'Candidaturas',
    href: '/candidaturas',
  },
  {
    key: 'research-topics',
    label: 'Temas de pesquisa',
    href: '/temas-de-pesquisa',
  },
];

interface ManagementPageLayoutProps {
  activeTab: ManagementTabKey;
  children: ReactNode;
}

export function ManagementPageLayout({ activeTab, children }: ManagementPageLayoutProps) {
  const { data: user } = useAuth();
  const profileInitials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`
    .toUpperCase()
    .trim();

  return (
    <div className="mx-auto flex w-full max-w-300 flex-1 flex-col space-y-8 p-8">
      <ManagementTopNav
        tabs={MANAGEMENT_TABS.map(tab => ({
          ...tab,
          active: tab.key === activeTab,
        }))}
        profileHref="/"
        profileInitials={profileInitials}
        profileAriaLabel="Ir para perfil do usuário"
      />

      {children}
    </div>
  );
}
