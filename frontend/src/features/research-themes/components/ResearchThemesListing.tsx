import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { api } from '@/lib/api';
import { formatNumberPtBr } from '@/lib/formatters';

interface Props {
  page: number;
  search: string;
  level: 'all' | 'masters' | 'doctoral';
}

export function ResearchThemesListing({ page, search, level }: Props) {
  const navigate = useNavigate();
  const PAGE_SIZE = 10;

  const [localSearch, setLocalSearch] = React.useState(search);
  const debouncedSearch = useDebounce(localSearch, 300);

  React.useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['research-themes', page, PAGE_SIZE, debouncedSearch, level],
    queryFn: () =>
      api.researchThemes.findAll({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        level: level === 'all' ? undefined : level,
      }),
  });

  const themes = data?.data ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  type SearchParams = { page: number; search: string; level: 'all' | 'masters' | 'doctoral' };

  function pushSearch(patch: Partial<SearchParams>) {
    void navigate({
      to: '/research-themes',
      search: prev => ({ ...prev, ...patch } as SearchParams),
    });
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Temas de Pesquisa
        </h1>
        <p className="text-sm text-slate-500">
          Explore os temas de pesquisa disponíveis no programa de pós-graduação.
        </p>
      </div>

      <Card className="rounded-3xl border-slate-200">
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Input
                placeholder="Buscar por título ou nome do orientador..."
                value={localSearch}
                onChange={e => {
                  setLocalSearch(e.target.value);
                  pushSearch({ search: e.target.value, page: 1 });
                }}
                className="w-full"
              />
            </div>
            <div>
              <Select
                value={level}
                onValueChange={val => pushSearch({ level: val as 'all' | 'masters' | 'doctoral', page: 1 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Níveis</SelectItem>
                  <SelectItem value="masters">Mestrado</SelectItem>
                  <SelectItem value="doctoral">Doutorado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-3xl border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Temas Disponíveis ({total})
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 p-0">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-500">Carregando temas...</div>
          ) : themes.length > 0 ? (
            themes.map(theme => (
              <div key={theme.id} className="p-6 transition-colors hover:bg-slate-50/50">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-serif text-lg font-medium text-slate-900">{theme.title}</p>
                    <Badge variant={theme.level === 'masters' ? 'default' : 'secondary'}>
                      {theme.level === 'masters' ? 'Mestrado' : 'Doutorado'}
                    </Badge>
                    {theme.vacancies === 0 && (
                      <Badge variant="destructive">Sem vagas</Badge>
                    )}
                  </div>

                  <p className="line-clamp-3 text-sm text-slate-600">{theme.description}</p>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                    <span>
                      Orientador:{' '}
                      <strong className="text-slate-800">
                        {theme.professor
                          ? `${theme.professor.firstName} ${theme.professor.lastName}`
                          : 'Desconhecido'}
                      </strong>
                    </span>
                    <span>
                      Vagas:{' '}
                      <strong className="text-slate-800">
                        {formatNumberPtBr(theme.vacancies)}
                      </strong>
                    </span>
                  </div>

                  {theme.associatedProfessors && theme.associatedProfessors.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs text-slate-400">Colaboradores:</span>
                      {theme.associatedProfessors.map(p => (
                        <Badge
                          key={p.id}
                          variant="outline"
                          className="px-2 py-0 text-[10px] font-normal"
                        >
                          {p.firstName} {p.lastName}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-sm text-slate-400">
              Nenhum tema encontrado para os filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => pushSearch({ page: Math.max(1, page - 1) })}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <div className="text-xs text-slate-500">
            Página {page} de {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => pushSearch({ page: Math.min(totalPages, page + 1) })}
            disabled={page === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
