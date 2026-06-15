import { authQueryOptions } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { AUTH_SIGN_IN_ROUTE } from '@/lib/auth-flow';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const DEV_USERS = [
  { email: 'candidate@anubis.com', role: 'candidate', label: 'Candidato' },
  { email: 'professor@anubis.com', role: 'professor', label: 'Professor' },
  { email: 'secretary@anubis.com', role: 'mdcc-secretary', label: 'Secretário' },
  { email: 'coordinator@anubis.com', role: 'post-graduate-coordinator', label: 'Coordenador' },
  { email: 'vice@anubis.com', role: 'post-graduate-vice-coordinator', label: 'Vice-Coord.' },
] as const;

const PASSWORD = 'senha123';

type Position =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'top-left'
  | 'top-right';

const POSITION_CLASSES: Record<Position, string> = {
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
};

const ROLE_DOT: Record<string, string> = {
  candidate: 'bg-blue-500',
  professor: 'bg-emerald-500',
  'mdcc-secretary': 'bg-yellow-500',
  'post-graduate-coordinator': 'bg-purple-500',
  'post-graduate-vice-coordinator': 'bg-pink-500',
};

interface CurrentUser {
  email: string | null;
  firstName: string | null;
  role: string;
}

interface DevUserSwitcherProps {
  position?: Position;
}

export function DevUserSwitcher({ position = 'bottom-center' }: DevUserSwitcherProps) {
  if (!import.meta.env.DEV) return null;
  return <Inner position={position} />;
}

function Inner({ position }: { position: Position }) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  const currentUser = queryClient.getQueryData<CurrentUser>(authQueryOptions.queryKey);
  const dotColor = currentUser ? (ROLE_DOT[currentUser.role] ?? 'bg-zinc-500') : null;

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  async function switchTo(email: string) {
    if (switching) return;
    setSwitching(email);
    try {
      await api.auth.logout().catch(() => {});
      await queryClient.cancelQueries();
      await api.auth.emailLogin({ email, password: PASSWORD });
      // Invalidate (not clear) so the mounted useAuth() observer refetches and
      // the navbar picks up the new role. queryClient.clear() destroys Query
      // objects and orphans active observers, leaving the navbar stale.
      await queryClient.invalidateQueries();
      navigate({ to: '/' });
      setOpen(false);
    } catch (err) {
      console.error('[DevUserSwitcher] switch failed:', err);
    } finally {
      setSwitching(null);
    }
  }

  async function logout() {
    if (switching) return;
    setSwitching('__logout__');
    try {
      await api.auth.logout().catch(() => {});
      await queryClient.cancelQueries();
      queryClient.clear();
      navigate({ to: AUTH_SIGN_IN_ROUTE });
      setOpen(false);
    } finally {
      setSwitching(null);
    }
  }

  const posClass = POSITION_CLASSES[position];

  if (!open) {
    return (
      <div className={`fixed z-[9999] ${posClass}`}>
        <button
          onClick={() => setOpen(true)}
          title="Dev: Trocar usuário"
          className={[
            'flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 shadow-lg transition-colors hover:border-zinc-400 hover:bg-zinc-800 hover:text-white active:scale-95',
            currentUser ? 'h-8 px-2.5 font-mono text-xs' : 'h-8 w-8 justify-center',
          ].join(' ')}
        >
          {currentUser ? (
            <>
              <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`} />
              <span className="text-zinc-200">{currentUser.firstName ?? currentUser.email}</span>
            </>
          ) : (
            <User size={14} />
          )}
        </button>
      </div>
    );
  }

  return (
    <div ref={panelRef} className={`fixed z-[9999] ${posClass}`}>
      <div className="w-60 rounded-lg border border-zinc-700 bg-zinc-900 font-mono text-xs text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-700 px-3 py-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
            dev · user switcher
          </span>
          <button
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded p-0.5 text-sm leading-none text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
          >
            ✕
          </button>
        </div>

        {currentUser && (
          <div className="border-b border-zinc-700 px-3 py-2">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">logado como</p>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`} />
              <span className="truncate text-zinc-200">{currentUser.email ?? '—'}</span>
            </div>
            <p className="mt-0.5 pl-4 text-[10px] text-zinc-500">{currentUser.role}</p>
          </div>
        )}

        <div className="flex flex-col gap-0.5 p-2">
          {DEV_USERS.map(u => {
            const isActive = currentUser?.email === u.email;
            const isLoading = switching === u.email;
            return (
              <button
                key={u.email}
                onClick={() => !isActive && switchTo(u.email)}
                disabled={isActive || !!switching}
                className={[
                  'flex items-center gap-2 rounded px-2 py-1.5 text-left transition-colors',
                  isActive
                    ? 'cursor-default bg-zinc-700 text-white'
                    : 'cursor-pointer text-zinc-300 hover:bg-zinc-800 hover:text-white',
                  switching && !isLoading ? 'opacity-40' : '',
                ].join(' ')}
              >
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${ROLE_DOT[u.role]}`} />
                <span className="flex-1 truncate">{u.label}</span>
                {isActive && <span className="text-[10px] text-zinc-500">ativo</span>}
                {isLoading && (
                  <span className="animate-pulse text-[10px] text-zinc-400">trocando…</span>
                )}
              </button>
            );
          })}

          {currentUser && (
            <>
              <div className="my-1 border-t border-zinc-700" />
              <button
                onClick={logout}
                disabled={!!switching}
                className={[
                  'flex items-center gap-2 rounded px-2 py-1.5 text-left text-red-400 transition-colors hover:bg-zinc-800 hover:text-red-300',
                  switching === '__logout__' ? 'opacity-40' : 'cursor-pointer',
                ].join(' ')}
              >
                <LogOut size={12} />
                <span className="flex-1">Sair</span>
                {switching === '__logout__' && (
                  <span className="animate-pulse text-[10px] text-zinc-400">saindo…</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
