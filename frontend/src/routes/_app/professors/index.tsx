import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Search, UserPlus, MoreVertical, Mail, KeyRound, ToggleLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ManagementTopNav } from '@/components/management-top-nav';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { mockDocentes, type Docente, type StatusDocente } from '@/lib/mock-professors-management';

export const Route = createFileRoute('/_app/professors/')({
  component: GestaoDocentesScreen,
});

const MANAGEMENT_TABS = [
  {
    key: 'overview',
    label: 'Visão geral',
    href: '/',
  },
  {
    key: 'professors',
    label: 'Professores',
    href: '/professors/',
    active: true,
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
] as const;

export function GestaoDocentesScreen() {
  const { data: user } = useAuth();
  const [docentes, setDocentes] = React.useState<Docente[]>(mockDocentes);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [docenteParaReenvio, setDocenteParaReenvio] = React.useState<Docente | null>(null);
  const [docenteParaAcoes, setDocenteParaAcoes] = React.useState<Docente | null>(null);
  const profileInitials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`
    .toUpperCase()
    .trim();

  const docentesFiltrados = docentes.filter(d =>
    d.nome.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleReenviarConvite = () => {
    // TODO: Plugar com a mutação do TanStack Query futuramente
    toast.success(`Convite reenviado para ${docenteParaReenvio?.email}.`);
    setDocenteParaReenvio(null);
  };

  const handleToggleDocenteStatus = () => {
    if (!docenteParaAcoes) {
      return;
    }

    setDocentes(current =>
      current.map(docente => {
        if (docente.id !== docenteParaAcoes.id) {
          return docente;
        }

        return {
          ...docente,
          status: docente.status === 'Desativado' ? 'Verificado' : 'Desativado',
        };
      }),
    );

    toast.success(
      docenteParaAcoes.status === 'Desativado'
        ? `Docente ${docenteParaAcoes.nome} ativado com sucesso.`
        : `Docente ${docenteParaAcoes.nome} desativado com sucesso.`,
    );
    setDocenteParaAcoes(null);
  };

  const handleRedefinirSenha = () => {
    if (!docenteParaAcoes) {
      return;
    }

    // TODO: Plugar com a mutação do TanStack Query futuramente
    toast.success(`Solicitação de redefinição de senha enviada para ${docenteParaAcoes.email}.`);
    setDocenteParaAcoes(null);
  };

  const renderBadgeStatus = (status: StatusDocente) => {
    switch (status) {
      case 'Verificado':
        return (
          <Badge
            variant="outline"
            className="border-green-200 bg-green-50 font-medium text-green-700 hover:bg-green-50"
          >
            Verificado
          </Badge>
        );
      case 'Pendente':
        return (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 font-medium text-amber-700 hover:bg-amber-50"
          >
            Pendente
          </Badge>
        );
      case 'Desativado':
        return (
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-100 font-medium text-slate-500 hover:bg-slate-100"
          >
            Desativado
          </Badge>
        );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-300 flex-1 flex-col space-y-8 p-8">
      <ManagementTopNav
        tabs={MANAGEMENT_TABS.map(tab => ({ ...tab }))}
        profileHref="/"
        profileInitials={profileInitials}
        profileAriaLabel="Ir para perfil do usuário"
      />

      {/* Cabeçalho */}
      <div>
        <div className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          SISTEMA MDCC / GESTÃO ADMINISTRATIVA
        </div>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-slate-900">
            Gestão de Docentes
          </h1>
          <Button disabled className="bg-blue-600 font-medium text-white hover:bg-blue-700">
            <UserPlus className="mr-2 h-4 w-4" />
            Cadastrar Novo Docente
          </Button>
        </div>
      </div>

      {/* Busca */}
      <div className="flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Pesquisar docente..."
            className="border-slate-200 bg-white pl-9 shadow-sm focus-visible:ring-blue-500"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-100 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                NOME DO DOCENTE
              </TableHead>
              <TableHead className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                E-MAIL
              </TableHead>
              <TableHead className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                STATUS
              </TableHead>
              <TableHead className="pr-6 text-right text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                AÇÕES
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docentesFiltrados.map(docente => (
              <TableRow
                key={docente.id}
                className={`group ${docente.status === 'Desativado' ? 'bg-slate-50/50 opacity-60' : ''}`}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-4">
                    <Avatar
                      className={`h-10 w-10 ${docente.status === 'Desativado' ? 'grayscale' : ''}`}
                    >
                      <AvatarImage src={docente.avatarUrl} />
                      <AvatarFallback className="bg-slate-100 text-sm font-semibold text-slate-600">
                        {docente.nome.match(/[A-Z]/g)?.slice(0, 2).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{docente.nome}</span>
                      <span className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                        {docente.tipo}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-600">{docente.email}</TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    {renderBadgeStatus(docente.status)}
                    {docente.status === 'Pendente' && (
                      <button
                        onClick={() => setDocenteParaReenvio(docente)}
                        className="mt-1 text-[10px] font-bold tracking-wider text-blue-600 uppercase transition-colors hover:text-blue-800"
                      >
                        REENVIAR CONVITE
                      </button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900"
                    onClick={() => setDocenteParaAcoes(docente)}
                  >
                    <span className="sr-only">Abrir ações</span>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé - Paginação */}
      <div className="flex items-center justify-between pt-2 text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase">
              ITENS POR PÁGINA:
            </span>
            <Select defaultValue="10">
              <SelectTrigger className="h-8 w-17.5 text-xs font-medium">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-[11px] font-bold tracking-wider uppercase">
            EXIBINDO 1-4 DE 42 DOCENTES
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="text-[11px] font-bold tracking-wider text-slate-400 uppercase"
          >
            &lt; ANTERIOR
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[11px] font-bold tracking-wider text-blue-600 uppercase hover:text-blue-700"
          >
            PRÓXIMO &gt;
          </Button>
        </div>
      </div>

      {/* Modal de Reenvio */}
      <Dialog
        open={!!docenteParaReenvio}
        onOpenChange={open => !open && setDocenteParaReenvio(null)}
      >
        <DialogContent className="p-6 sm:max-w-106.25">
          <DialogHeader className="mb-2">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="font-serif text-xl font-bold text-slate-900">
                  Confirmar Reenvio
                </DialogTitle>
                <DialogDescription className="mt-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  AÇÃO ADMINISTRATIVA
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="mb-6 space-y-3">
            <p className="text-sm font-medium text-slate-700">
              Deseja reenviar o convite de acesso para este docente?
            </p>
            <p className="text-sm leading-relaxed text-slate-500">
              Um novo link de ativação será enviado para o e-mail cadastrado. O link anterior será
              invalidado.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDocenteParaReenvio(null)}
              className="border-slate-200 font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReenviarConvite}
              className="bg-blue-600 font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Confirmar Reenvio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!docenteParaAcoes} onOpenChange={open => !open && setDocenteParaAcoes(null)}>
        <DialogContent className="p-6 sm:max-w-106.25">
          <DialogHeader className="mb-2">
            <DialogTitle className="font-serif text-xl font-bold text-slate-900">
              Ações do docente
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-500">
              Escolha a ação que deseja executar para {docenteParaAcoes?.nome}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start border-slate-200 font-medium text-slate-700 hover:bg-slate-50"
              onClick={handleToggleDocenteStatus}
            >
              <ToggleLeft className="mr-2 h-4 w-4 text-slate-500" />
              {docenteParaAcoes?.status === 'Desativado' ? 'ATIVAR DOCENTE' : 'DESATIVAR DOCENTE'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full justify-start border-slate-200 font-medium text-slate-700 hover:bg-slate-50"
              onClick={handleRedefinirSenha}
            >
              <KeyRound className="mr-2 h-4 w-4 text-slate-500" />
              REDEFINIR SENHA
            </Button>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDocenteParaAcoes(null)}
              className="border-slate-200 font-medium text-slate-600 hover:bg-slate-50"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
