import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useMergeCourses,
  useMergeUniversities,
  usePendingCourses,
  usePendingUniversities,
  useSetCourseStatus,
  useSetUniversityGrade,
  useSetUniversityStatus,
  useSimilarCourses,
  useSimilarUniversities,
} from '@/features/enrollment/hooks/use-universities';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircle, Check, GitMerge, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_app/manage/universities')({
  component: UniversitiesManagementPage,
});

function UniversitiesManagementPage() {
  const [activeTab, setActiveTab] = useState<'universities' | 'courses'>('universities');

  // Queries
  const { data: pendingUnis = [], isLoading: loadingUnis } = usePendingUniversities();
  const { data: pendingCourses = [], isLoading: loadingCourses } = usePendingCourses();

  // Mutations
  const setGrade = useSetUniversityGrade();
  const setUniStatus = useSetUniversityStatus();
  const setCourseStatus = useSetCourseStatus();

  // Merge modal state
  const [mergeSourceUni, setMergeSourceUni] = useState<{ id: string; name: string } | null>(null);
  const [mergeSourceCourse, setMergeSourceCourse] = useState<{ id: string; name: string } | null>(
    null,
  );

  const handleApproveUni = async (id: string) => {
    try {
      await setUniStatus.mutateAsync({ id, status: 'approved' });
      toast.success('Universidade aprovada com sucesso.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao aprovar universidade.');
    }
  };

  const handleInvalidateUni = async (id: string) => {
    try {
      await setUniStatus.mutateAsync({ id, status: 'invalidated' });
      toast.success('Universidade invalidada.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao invalidar universidade.');
    }
  };

  const handleApproveCourse = async (id: string) => {
    try {
      await setCourseStatus.mutateAsync({ id, status: 'approved' });
      toast.success('Curso aprovado com sucesso.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao aprovar curso.');
    }
  };

  const handleInvalidateCourse = async (id: string) => {
    try {
      await setCourseStatus.mutateAsync({ id, status: 'invalidated' });
      toast.success('Curso invalidado.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao invalidar curso.');
    }
  };

  const handleGradeChange = async (id: string, gradeStr: string) => {
    const grade = parseInt(gradeStr);
    try {
      await setGrade.mutateAsync({ id, mecGrade: grade });
      toast.success('Nota MEC atualizada.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar nota MEC.');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col space-y-8 p-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Início</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Gerenciar Instituições e Cursos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-800">
            Instituições e Cursos Pendentes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Revise dados informados manualmente pelos candidatos, atribua notas MEC e trate
            duplicatas.
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('universities')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'universities'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Universidades ({pendingUnis.length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'courses'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Cursos ({pendingCourses.length})
          </button>
        </div>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          {activeTab === 'universities' ? (
            loadingUnis ? (
              <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Carregando
                universidades...
              </div>
            ) : pendingUnis.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-2">
                <Check className="h-10 w-10 text-emerald-500" />
                <p className="text-sm font-medium">Nenhuma universidade pendente de revisão!</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Nome</TableHead>
                    <TableHead className="font-semibold text-slate-700">Sigla</TableHead>
                    <TableHead className="font-semibold text-slate-700">Localização</TableHead>
                    <TableHead className="font-semibold text-slate-700">Nota MEC</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUnis.map(uni => (
                    <TableRow key={uni.id} className="hover:bg-slate-50/30">
                      <TableCell className="font-medium text-slate-800">{uni.name}</TableCell>
                      <TableCell className="font-mono text-slate-500">
                        {uni.abbreviation || '-'}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {uni.city && uni.state
                          ? `${uni.city} - ${uni.state}`
                          : uni.state || uni.city || '-'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={uni.mecGrade !== null ? String(uni.mecGrade) : ''}
                          onValueChange={val => handleGradeChange(uni.id, val)}
                        >
                          <SelectTrigger className="h-8 w-28 rounded-xl font-mono text-xs">
                            <SelectValue placeholder="Atribuir..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 (Mínima)</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5 (Máxima)</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMergeSourceUni({ id: uni.id, name: uni.name })}
                            className="rounded-xl h-8 text-xs gap-1.5 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/50"
                          >
                            <GitMerge className="h-3.5 w-3.5" />
                            Mesclar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInvalidateUni(uni.id)}
                            className="rounded-xl h-8 text-xs gap-1 border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Invalidar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveUni(uni.id)}
                            className="rounded-xl h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Aprovar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : loadingCourses ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Carregando cursos...
            </div>
          ) : pendingCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-2">
              <Check className="h-10 w-10 text-emerald-500" />
              <p className="text-sm font-medium">Nenhum curso pendente de revisão!</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Nome</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingCourses.map(course => (
                  <TableRow key={course.id} className="hover:bg-slate-50/30">
                    <TableCell className="font-medium text-slate-800">{course.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMergeSourceCourse({ id: course.id, name: course.name })}
                          className="rounded-xl h-8 text-xs gap-1.5 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100/50"
                        >
                          <GitMerge className="h-3.5 w-3.5" />
                          Mesclar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInvalidateCourse(course.id)}
                          className="rounded-xl h-8 text-xs gap-1 border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/50"
                        >
                          <X className="h-3.5 w-3.5" />
                          Invalidar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproveCourse(course.id)}
                          className="rounded-xl h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Aprovar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Merge University Dialog */}
      {mergeSourceUni && (
        <MergeUniversityDialog source={mergeSourceUni} onClose={() => setMergeSourceUni(null)} />
      )}

      {/* Merge Course Dialog */}
      {mergeSourceCourse && (
        <MergeCourseDialog source={mergeSourceCourse} onClose={() => setMergeSourceCourse(null)} />
      )}
    </div>
  );
}

// ── Merge University Modal Component ─────────────────────────────────

interface MergeUniDialogProps {
  source: { id: string; name: string };
  onClose: () => void;
}

function MergeUniversityDialog({ source, onClose }: MergeUniDialogProps) {
  const { data: similar = [], isLoading } = useSimilarUniversities(source.id);
  const mergeMutation = useMergeUniversities();

  const handleMerge = async (targetId: string) => {
    try {
      await mergeMutation.mutateAsync({ id: source.id, targetId });
      toast.success('Universidades mescladas com sucesso.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao mesclar.');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white rounded-3xl p-6 shadow-xl z-50">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" />
            Mesclar Universidade
          </DialogTitle>
          <DialogDescription className="text-xs pt-1">
            Redirecione todas as inscrições que usam{' '}
            <span className="font-semibold text-slate-800">"{source.name}"</span> para a
            universidade selecionada abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 text-amber-800 text-xs my-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            <strong>Ação Irreversível:</strong> A universidade de origem será permanentemente
            deletada da base de dados.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-xs font-semibold text-slate-700">
            Sugestões de correspondência semelhante (Fuzzy Match):
          </p>

          {isLoading ? (
            <div className="flex justify-center py-4 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Buscando duplicatas semelhantes...
            </div>
          ) : similar.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 text-center">
              Nenhuma universidade semelhante encontrada no cadastro aprovado.
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {similar.map(uni => (
                <div
                  key={uni.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors"
                >
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{uni.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {uni.abbreviation ? `${uni.abbreviation} | ` : ''} {uni.city} - {uni.state}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleMerge(uni.id)}
                    disabled={mergeMutation.isPending}
                    size="sm"
                    className="rounded-xl text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Confirmar e Mesclar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Merge Course Modal Component ─────────────────────────────────────

interface MergeCourseDialogProps {
  source: { id: string; name: string };
  onClose: () => void;
}

function MergeCourseDialog({ source, onClose }: MergeCourseDialogProps) {
  const { data: similar = [], isLoading } = useSimilarCourses(source.id);
  const mergeMutation = useMergeCourses();

  const handleMerge = async (targetId: string) => {
    try {
      await mergeMutation.mutateAsync({ id: source.id, targetId });
      toast.success('Cursos mesclados com sucesso.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao mesclar.');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white rounded-3xl p-6 shadow-xl z-50">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg font-bold flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" />
            Mesclar Curso
          </DialogTitle>
          <DialogDescription className="text-xs pt-1">
            Redirecione todas as inscrições que usam o curso{' '}
            <span className="font-semibold text-slate-800">"{source.name}"</span> para o curso de
            destino.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2 text-amber-800 text-xs my-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            <strong>Ação Irreversível:</strong> O curso de origem será permanentemente deletado da
            base de dados.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-xs font-semibold text-slate-700">
            Sugestões de correspondência semelhante (Fuzzy Match):
          </p>

          {isLoading ? (
            <div className="flex justify-center py-4 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Buscando duplicatas semelhantes...
            </div>
          ) : similar.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 text-center">
              Nenhum curso semelhante cadastrado e aprovado.
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {similar.map(course => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors"
                >
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800">{course.name}</p>
                  </div>
                  <Button
                    onClick={() => handleMerge(course.id)}
                    disabled={mergeMutation.isPending}
                    size="sm"
                    className="rounded-xl text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Confirmar e Mesclar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
