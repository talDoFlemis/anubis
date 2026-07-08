import { useEffect, useRef, useState, type ReactElement } from 'react';

import { HOME_ROLE_LABELS } from '@/components/home/home-role-labels';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, useLogout } from '@/hooks/use-auth';
import { Link } from '@tanstack/react-router';

interface HeaderNavItem {
  label: string;
  to: string;
}

const MANAGEMENT_ROLES = new Set([
  'mdcc-secretary',
  'post-graduate-coordinator',
  'post-graduate-vice-coordinator',
]);

function getHeaderNavItems(role: string | null): HeaderNavItem[] {
  const items: HeaderNavItem[] = [{ label: 'Inicio', to: '/' }];

  if (role && MANAGEMENT_ROLES.has(role)) {
    items.push({ label: 'Gestao de docentes', to: '/manage/professors' });
    items.push({ label: 'Gestao de temas', to: '/manage/research-themes' });
    items.push({ label: 'Períodos de Inscrição', to: '/manage/enrollment-periods' });
    items.push({ label: 'Classificação Final', to: '/manage/classification' });
  } else {
    items.push({ label: 'Temas de Pesquisa', to: '/research-themes' });
  }

  if (role === 'candidate') {
    items.push({ label: 'Minha Inscrição', to: '/enrollment' });
  }

  if (role === 'professor') {
    items.push({ label: 'Avaliar Entrevistas', to: '/manage/interviews' });
  }

  return items;
}

function getInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.charAt(0)?.toUpperCase() ?? '';
  const last = lastName?.charAt(0)?.toUpperCase() ?? '';
  return first + last || '?';
}

function getDisplayName(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ') || 'Usuario';
}

export function AppHeader(): ReactElement | null {
  const { data: user } = useAuth();
  const logout = useLogout();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isAtTop = currentScrollY <= 0;
      const isScrollingUp = currentScrollY < lastScrollY.current;

      setIsVisible(isAtTop || isScrollingUp);
      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!user) {
    return null;
  }

  const navItems = getHeaderNavItems(user.role);
  const initials = getInitials(user.firstName, user.lastName);
  const displayName = getDisplayName(user.firstName, user.lastName);
  const roleLabel = HOME_ROLE_LABELS[user.role] ?? user.role;

  return (
    <header
      className={`bg-slate-50/90 sticky top-0 z-40 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 -bottom-6 h-6 bg-linear-to-b from-slate-200/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 -bottom-10 h-10 bg-linear-to-b from-slate-100/60 to-transparent" />
      <div className="mx-auto flex w-full max-w-300 flex-wrap items-center gap-4 px-6 py-4">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">Portal</span>
            <span className="text-xs text-slate-500">MDCC-UFC</span>
          </div>
        </div>

        <nav
          className="flex flex-1 flex-wrap justify-center gap-2"
          aria-label="Navegacao principal"
        >
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{
                className: 'bg-white text-slate-900',
              }}
              className="rounded-full px-4 py-2 text-xs font-semibold tracking-wide text-slate-600 uppercase transition-colors hover:bg-white hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-3 cursor-pointer rounded-full bg-white/80 px-3 py-2 text-left transition-colors hover:bg-white"
                aria-label="Abrir menu do perfil"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-blue-50 text-xs font-bold text-blue-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col sm:flex">
                  <span className="text-sm font-semibold text-slate-900">{displayName}</span>
                  <span className="text-xs text-slate-500">{roleLabel}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <div className="px-2 py-1.5 text-xs text-slate-500">
                <div className="text-xs font-semibold text-slate-900">{displayName}</div>
                <div className="text-xs text-slate-500">{user.email ?? 'Email nao informado'}</div>
              </div>
              <DropdownMenuItem
                className="cursor-pointer text-sm font-semibold text-red-600 focus:text-red-600"
                onSelect={event => {
                  event.preventDefault();
                  logout.mutate();
                }}
              >
                {logout.isPending ? 'Saindo...' : 'Sair'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
