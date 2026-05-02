import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ManagementTab {
  key: string;
  label: string;
  href: string;
  active?: boolean;
}

interface ManagementTopNavProps {
  tabs: ManagementTab[];
  profileHref: string;
  profileInitials?: string;
  profileAriaLabel?: string;
}

export function ManagementTopNav({
  tabs,
  profileHref,
  profileInitials,
  profileAriaLabel = 'Ir para perfil',
}: ManagementTopNavProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <nav className="flex flex-wrap items-center gap-2 rounded-full bg-slate-100/80 p-1">
        {tabs.map(tab =>
          tab.active ? (
            <span
              key={tab.key}
              className="rounded-full bg-white px-4 py-2 text-xs font-bold tracking-wide text-blue-700 uppercase shadow-sm"
            >
              {tab.label}
            </span>
          ) : (
            <a
              key={tab.key}
              href={tab.href}
              className="rounded-full px-4 py-2 text-xs font-bold tracking-wide text-slate-600 uppercase transition-colors hover:bg-white hover:text-slate-900"
            >
              {tab.label}
            </a>
          ),
        )}
      </nav>

      <a
        href={profileHref}
        aria-label={profileAriaLabel}
        className="rounded-full transition-transform hover:scale-105"
      >
        <Avatar className="h-10 w-10 ring-2 ring-slate-200">
          <AvatarFallback className="bg-blue-50 text-xs font-bold text-blue-700">
            {profileInitials || 'U'}
          </AvatarFallback>
        </Avatar>
      </a>
    </div>
  );
}
