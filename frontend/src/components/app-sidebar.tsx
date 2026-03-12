import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth, useLogout } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Home, Bell, PanelLeft, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

function getInitials(
  firstName: string | null,
  lastName: string | null,
): string {
  const first = firstName?.charAt(0)?.toUpperCase() ?? '';
  const last = lastName?.charAt(0)?.toUpperCase() ?? '';
  return first + last || '?';
}

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { data: user } = useAuth();
  const logout = useLogout();

  const initials = getInitials(user?.firstName ?? null, user?.lastName ?? null);
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Usuario';

  return (
    <div className="flex min-h-svh">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Toggle */}
        <div className="flex h-14 items-center px-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-9 w-9 text-sidebar-foreground"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          {!collapsed && (
            <span className="ml-2 font-semibold text-lg">Anubis</span>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* User profile section */}
        <div
          className={cn(
            'flex items-center gap-3 p-3',
            collapsed && 'justify-center',
          )}
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium">
                {displayName}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/">
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      collapsed && 'justify-center px-0',
                    )}
                  >
                    <Home className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>Inicio</span>}
                  </Button>
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Inicio</TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  <Bell className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>Notificacoes</span>}
                  {/* Placeholder notification badge */}
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    3
                  </span>
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">Notificacoes</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </nav>

        {/* Logout */}
        <div className="p-2">
          <Separator className="mb-2 bg-sidebar-border" />
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    collapsed && 'justify-center px-0',
                  )}
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <span>{logout.isPending ? 'Saindo...' : 'Sair'}</span>
                  )}
                </Button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Sair</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
