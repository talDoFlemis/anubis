import { useState } from 'react';

import { CheckCircle2, Clock, Filter, Loader2, Search, TrendingUp, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { SecretaryValidationTable } from '@/features/validation/components/SecretaryValidationTable';

import {
  useSecretaryCandidates,
  useSecretaryStats,
} from '@/features/validation/hooks/use-validation';

export function SecretaryDashboard() {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [status, setStatus] = useState('all');
  const [professor, setProfessor] = useState('all');
  const [page, setPage] = useState(1);

  const { data: stats, isLoading: loadingStats } = useSecretaryStats();
  const { data: candidatesData, isLoading: loadingCandidates } = useSecretaryCandidates({
    page,
    limit: 10,
    search,
    level,
    status,
    professor,
  });

  const total = stats?.total ?? 0;
  const validated = stats?.validated ?? 0;
  const pending = stats?.pending ?? 0;
  const progressPercentage = total > 0 ? Math.round((validated / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Dashboard KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                total
              )}
            </div>
            <p className="text-xs text-muted-foreground">Inscrições submetidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validações Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {loadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : validated}
            </div>
            <p className="text-xs text-muted-foreground">Currículos revisados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Revisão</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {loadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : pending}
            </div>
            <p className="text-xs text-muted-foreground">Currículos pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">
              {loadingStats ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `${progressPercentage}%`
              )}
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span className="hidden lg:inline">Filtros:</span>
              </div>

              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-35">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Níveis</SelectItem>
                  <SelectItem value="mestrado">Mestrado</SelectItem>
                  <SelectItem value="doutorado">Doutorado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-37.5">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Revisão</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>

              <Select value={professor} onValueChange={setProfessor}>
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Professor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Professores</SelectItem>
                  <SelectItem value="lincoln">Dr. Lincoln</SelectItem>
                  <SelectItem value="mariana">Dra. Mariana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <SecretaryValidationTable
        data={candidatesData?.data ?? []}
        loading={loadingCandidates}
        currentPage={page}
        onPageChange={setPage}
      />
    </div>
  );
}
