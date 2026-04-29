import { MoreVertical, Search } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Docente, StatusDocente } from '@/lib/mock-professors-management';

interface ProfessorsTableProps {
  docentes: Docente[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onOpenReenvio: (docente: Docente) => void;
  onOpenAcoes: (docente: Docente) => void;
}

function renderBadgeStatus(status: StatusDocente) {
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
}

export function ProfessorsTable({
  docentes,
  searchQuery,
  onSearchQueryChange,
  onOpenReenvio,
  onOpenAcoes,
}: ProfessorsTableProps) {
  return (
    <>
      <div className="flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Pesquisar docente..."
            className="border-slate-200 bg-white pl-9 shadow-sm focus-visible:ring-blue-500"
            value={searchQuery}
            onChange={event => onSearchQueryChange(event.target.value)}
          />
        </div>
      </div>

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
            {docentes.map(docente => (
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
                        onClick={() => onOpenReenvio(docente)}
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
                    onClick={() => onOpenAcoes(docente)}
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
    </>
  );
}
