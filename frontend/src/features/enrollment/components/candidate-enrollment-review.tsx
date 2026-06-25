import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  User,
  X,
  XCircle,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useCvItems,
  useScoringCategories,
  useVerifyCvItem,
} from '@/features/enrollment/hooks/use-cv-scoring';
import type { CvItem, ScoringCategory } from '@/lib/api';
import { api } from '@/lib/api';

interface CandidateEnrollmentReviewProps {
  id: string;
}

// ── Category Key Resolver ────────────────────────────────────────────

function getCategoryKey(name: string): string {
  const normalized = name.toLowerCase().trim();
  if (normalized.includes('projeto') || normalized.includes('participação de projetos'))
    return 'PROJECTS';
  if (normalized.includes('produção científica') || normalized.includes('producao cientifica'))
    return 'PRODUCTION';
  if (
    normalized.includes('docência') ||
    normalized.includes('docencia') ||
    normalized.includes('docente')
  )
    return 'TEACHING';
  if (normalized.includes('orientação') || normalized.includes('orientacao')) return 'ORIENTATION';
  if (
    normalized.includes('apresentação') ||
    normalized.includes('apresentacao') ||
    normalized.includes('evento')
  )
    return 'EVENTS';
  return 'UNKNOWN';
}

// ── Score Calculator ─────────────────────────────────────────────────

function computeCategoryScore(items: CvItem[], category: ScoringCategory, level: string): number {
  const categoryItems = items.filter(i => i.scoringCategoryId === category.id);
  const key = getCategoryKey(category.name);

  let totalScore = 0;
  for (const item of categoryItems) {
    if (item.score !== null) {
      totalScore += parseFloat(item.score);
      continue;
    }

    if (item.isVerified === 'incorrect' && !item.correctedClassification) {
      continue;
    }

    const activeClassification =
      item.isVerified === 'incorrect' && item.correctedClassification
        ? item.correctedClassification
        : item.classification || 'none';

    switch (key) {
      case 'PROJECTS': {
        const basePoints = level === 'masters' ? 0.3 : 0.2;
        const areaBonus = level === 'masters' ? 0.2 : 0.1;
        totalScore += item.quantity * (basePoints + (item.isInArea ? areaBonus : 0));
        break;
      }
      case 'PRODUCTION': {
        if (level === 'masters' && item.isEncontroIc) {
          totalScore += 0.1;
        } else {
          const classPoints: Record<string, number> = {
            A1: 0.6,
            A2: 0.6,
            A3: 0.6,
            A4: 0.6,
            A5: 0.4,
            A6: 0.4,
            A7: 0.2,
            A8: 0.2,
            none: 0.1,
          };
          let itemScore = classPoints[activeClassification] ?? 0.1;
          if (item.isComplete) itemScore += 0.2;
          else if (item.isResumo) itemScore += 0.1;
          if (item.isPeriodico) itemScore += 0.2;
          if (item.isAutorPrincipal) itemScore += 0.2;
          if (level === 'doctoral' && item.isDissertacao) itemScore += 0.1;
          totalScore += itemScore;
        }
        break;
      }
      case 'TEACHING': {
        const points = level === 'masters' ? (item.docenciaType === 'ies' ? 0.3 : 0.2) : 0.2;
        totalScore += item.quantity * points;
        break;
      }
      case 'ORIENTATION': {
        totalScore += item.quantity * 0.2;
        break;
      }
      case 'EVENTS': {
        const points =
          item.eventoType === 'internacional' ? 0.3 : item.eventoType === 'nacional' ? 0.2 : 0.1;
        totalScore += item.quantity * points;
        break;
      }
      default: {
        totalScore += item.quantity * parseFloat(category.pointsPerItem);
        break;
      }
    }
  }

  return parseFloat(Math.min(totalScore, parseFloat(category.maxPoints)).toFixed(2));
}

export function CandidateEnrollmentReview({ id }: CandidateEnrollmentReviewProps) {
  // ── Queries ────────────────────────────────────────────────────────

  const {
    data: enrollment,
    isLoading: enrollmentLoading,
    error: enrollmentError,
  } = useQuery({
    queryKey: ['enrollments', id],
    queryFn: () => api.enrollments.findById(id),
    enabled: !!id,
  });

  const { data: cvItems, isLoading: itemsLoading } = useCvItems(id);

  const { data: candidate, isLoading: candidateLoading } = useQuery({
    queryKey: ['candidate', enrollment?.candidateId],
    queryFn: () => api.candidates.findById(enrollment?.candidateId || ''),
    enabled: !!enrollment?.candidateId,
  });

  const { data: themesData } = useQuery({
    queryKey: ['research-themes-all'],
    queryFn: () => api.researchThemes.findAll({ limit: 100 }),
  });
  const themes = themesData?.data ?? [];

  const { data: categories } = useScoringCategories(
    enrollment?.enrollmentPeriodId || '',
    enrollment?.level || '',
  );

  const verifyCvItem = useVerifyCvItem();

  // ── Local Form State for correction ────────────────────────────────
  const [correctingItemId, setCorrectingItemId] = React.useState<string | null>(null);
  const [correctedClassification, setCorrectedClassification] = React.useState<string>('none');
  const [verificationComment, setVerificationComment] = React.useState<string>('');

  // ── Computed Values ───────────────────────────────────────────────

  const sortedCategories = React.useMemo(
    () => [...(categories ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const itemsByCategory = React.useMemo(() => {
    const map = new Map<string, CvItem[]>();
    for (const item of cvItems ?? []) {
      const list = map.get(item.scoringCategoryId) ?? [];
      list.push(item);
      map.set(item.scoringCategoryId, list);
    }
    return map;
  }, [cvItems]);

  const totalScore = React.useMemo(() => {
    if (!sortedCategories.length || !cvItems || !enrollment) return 0;
    return sortedCategories.reduce(
      (sum, cat) => sum + computeCategoryScore(cvItems, cat, enrollment.level),
      0,
    );
  }, [sortedCategories, cvItems, enrollment]);

  const primaryThemeName = React.useMemo(() => {
    if (!enrollment?.primaryThemeId || !themes.length) return '—';
    return themes.find(t => t.id === enrollment.primaryThemeId)?.title ?? 'Tema não encontrado';
  }, [enrollment, themes]);

  const secondaryThemeName = React.useMemo(() => {
    if (!enrollment?.secondaryThemeId || !themes.length) return '—';
    return themes.find(t => t.id === enrollment.secondaryThemeId)?.title ?? 'Tema não encontrado';
  }, [enrollment, themes]);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleDownloadProof = async (itemId: string) => {
    try {
      const url = await api.cvItems.getFileUrl(id, itemId);
      window.open(url, '_blank');
    } catch {
      toast.error('Erro ao obter o arquivo de comprovação.');
    }
  };

  const handleDownloadSigaa = async () => {
    try {
      const { url } = await api.enrollments.getSigaaReceiptInfo(id);
      window.open(url, '_blank');
    } catch {
      toast.error('Erro ao obter comprovante do SIGAA.');
    }
  };

  const handleDownloadPoscomp = async () => {
    try {
      const { url } = await api.enrollments.getPoscompReceiptInfo(id);
      window.open(url, '_blank');
    } catch {
      toast.error('Erro ao obter comprovante do POSCOMP.');
    }
  };

  const handleVerifyItem = (itemId: string, isVerified: 'verified' | 'incorrect') => {
    if (isVerified === 'verified') {
      verifyCvItem.mutate(
        {
          enrollmentId: id,
          itemId,
          payload: { isVerified: 'verified' },
        },
        {
          onSuccess: () => {
            toast.success('Item validado com sucesso.');
          },
          onError: err => {
            toast.error(err.message || 'Erro ao validar item.');
          },
        },
      );
    } else {
      const currentItem = cvItems?.find(i => i.id === itemId);
      setCorrectingItemId(itemId);
      setCorrectedClassification(currentItem?.classification || 'none');
      setVerificationComment(currentItem?.verificationComment || '');
    }
  };

  const handleSaveCorrection = () => {
    if (!correctingItemId) return;

    verifyCvItem.mutate(
      {
        enrollmentId: id,
        itemId: correctingItemId,
        payload: {
          isVerified: 'incorrect',
          correctedClassification,
          verificationComment: verificationComment.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Correção registrada com sucesso.');
          setCorrectingItemId(null);
        },
        onError: err => {
          toast.error(err.message || 'Erro ao registrar correção.');
        },
      },
    );
  };

  // ── Status display helpers ─────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-0">
            Rascunho
          </Badge>
        );
      case 'submitted':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800 border-0">
            Submetido
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            Encerrado
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-700 border-0">
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDatePtBr = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ── Render States ──────────────────────────────────────────────────

  if (enrollmentLoading || candidateLoading || itemsLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-80 md:col-span-1 rounded-3xl" />
          <Skeleton className="h-80 md:col-span-2 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (enrollmentError || !enrollment) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold font-serif">Inscrição não encontrada</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          A inscrição solicitada não foi encontrada ou ocorreu um erro de comunicação com o
          servidor.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    );
  }

  const candidateDisplayName =
    [candidate?.firstName, candidate?.lastName].filter(Boolean).join(' ') || 'Candidato';

  return (
    <div className="relative z-10 mx-auto max-w-7xl space-y-6">
      {/* Top Navigation / Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="gap-2 rounded-full">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao painel
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          {getStatusBadge(enrollment.status)}
          <span className="text-xs text-muted-foreground">
            Última atualização: {formatDatePtBr(enrollment.updatedAt)}
          </span>
        </div>
      </div>

      {/* Main Candidate Card */}
      <Card className="overflow-hidden rounded-4xl border border-slate-100 shadow-md">
        <CardContent className="p-7 sm:p-9 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-4">
              <p className="font-label text-primary text-sm tracking-wide uppercase">
                {enrollment.level === 'masters'
                  ? 'Candidatura de Mestrado'
                  : 'Candidatura de Doutorado'}
              </p>
              <div className="space-y-2">
                <h1 className="text-foreground font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
                  {candidateDisplayName}
                </h1>
                <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed flex items-center gap-2">
                  <User className="h-4 w-4 shrink-0 text-slate-400" />
                  E-mail: {candidate?.email ?? 'Não informado'} | CPF:{' '}
                  {candidate?.cpf ?? 'Não informado'}
                </p>
              </div>
            </div>

            {/* Total CV Score Summary */}
            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 flex items-center gap-4 shrink-0">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Calculator className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pontuação do Currículo
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-label text-primary">
                    {totalScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    pontos calculados
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column details section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Academic & Enrollment details */}
        <div className="md:col-span-1 space-y-6">
          {/* Themes & Identification */}
          <Card className="rounded-3xl border border-slate-100 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-lg font-serif font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Opção de Pesquisa
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Tema Primário
                </span>
                <p className="font-medium text-slate-800 leading-snug">{primaryThemeName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Tema Secundário
                </span>
                <p className="font-medium text-slate-800 leading-snug">{secondaryThemeName}</p>
              </div>
              {enrollment.justification && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Justificativa
                  </span>
                  <p className="text-slate-600 leading-relaxed italic bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    "{enrollment.justification}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Academic Info / SIGAA / POSCOMP */}
          <Card className="rounded-3xl border border-slate-100 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-lg font-serif font-semibold text-slate-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Dados Acadêmicos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-5 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Universidade de Origem
                </span>
                <p className="font-medium text-slate-800">{candidate?.universityOfOrigin ?? '—'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  IRA do Candidato
                </span>
                <p className="font-semibold text-slate-800 text-lg">
                  {candidate?.ira ? parseFloat(candidate.ira).toFixed(2) : '—'}
                </p>
              </div>

              {/* SIGAA */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    SIGAA (Inscrição)
                  </span>
                  {enrollment.sigaaCode && (
                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                      {enrollment.sigaaCode}
                    </Badge>
                  )}
                </div>
                {enrollment.sigaaReceiptFileId ? (
                  <Button
                    onClick={handleDownloadSigaa}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 rounded-xl text-slate-700 border-slate-200"
                  >
                    <Download className="h-4 w-4" />
                    Baixar comprovante SIGAA
                  </Button>
                ) : (
                  <p className="text-xs text-red-500 flex items-center gap-1.5 pt-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Comprovante SIGAA não enviado
                  </p>
                )}
              </div>

              {/* POSCOMP */}
              {enrollment.poscomp?.hasPoscomp ? (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    POSCOMP (Edição {enrollment.poscomp.year})
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Mat
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {enrollment.poscomp.mathScore}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Fund
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {enrollment.poscomp.fundamentalsScore}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Tec
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {enrollment.poscomp.technologyScore}
                      </p>
                    </div>
                  </div>
                  {enrollment.poscomp.receiptFileId ? (
                    <Button
                      onClick={handleDownloadPoscomp}
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 rounded-xl text-slate-700 border-slate-200"
                    >
                      <Download className="h-4 w-4" />
                      Baixar comprovante POSCOMP
                    </Button>
                  ) : (
                    <p className="text-xs text-amber-500 flex items-center gap-1.5 pt-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      Comprovante POSCOMP ausente
                    </p>
                  )}
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100 text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Candidato não realizou o POSCOMP
                </div>
              )}
            </CardContent>
          </Card>

          {/* Master Degrees (if doctoral) */}
          {enrollment.level === 'doctoral' && (
            <Card className="rounded-3xl border border-slate-100 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="text-lg font-serif font-semibold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Cursos de Mestrado
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {enrollment.mastersDegrees && enrollment.mastersDegrees.length > 0 ? (
                  enrollment.mastersDegrees.map((degree, index) => (
                    <div
                      key={index}
                      className="space-y-2 text-sm bg-slate-50/50 p-3 rounded-2xl border border-slate-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{degree.university}</span>
                        {degree.isPrimary && (
                          <Badge
                            variant="default"
                            className="text-[10px] uppercase font-bold py-0.5 px-2 bg-blue-500"
                          >
                            Principal
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-snug">
                        Programa: {degree.graduateProgram}
                      </p>
                      <p className="text-xs text-slate-500">
                        IRA:{' '}
                        <span className="font-semibold text-slate-700">
                          {degree.ira.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-red-500 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Nenhum curso de mestrado informado
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: CV Items Grouped by Category */}
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-3xl border border-slate-100 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-lg font-serif font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Validação de Documentos do Currículo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {sortedCategories.length > 0 ? (
                sortedCategories.map(category => {
                  const items = itemsByCategory.get(category.id) ?? [];
                  const categoryScore = computeCategoryScore(
                    cvItems ?? [],
                    category,
                    enrollment.level,
                  );
                  const maxPoints = parseFloat(category.maxPoints);

                  return (
                    <div
                      key={category.id}
                      className="border border-slate-100 rounded-3xl p-5 space-y-4 bg-slate-50/20"
                    >
                      {/* Category Header */}
                      <div className="flex items-start justify-between gap-4 pb-2 border-b border-slate-100/50">
                        <div className="space-y-1">
                          <h3 className="font-serif text-base font-semibold text-slate-900">
                            {category.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Pontuação máxima: {maxPoints.toFixed(1)} ponto(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-label text-sm font-bold text-primary">
                            {categoryScore.toFixed(1)} / {maxPoints.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Category Items list */}
                      <div className="space-y-4">
                        {items.length > 0 ? (
                          items.map(item => {
                            const isCorrecting = correctingItemId === item.id;
                            const isItemPending = item.isVerified === 'pending';
                            const isItemVerified = item.isVerified === 'verified';
                            const isItemIncorrect = item.isVerified === 'incorrect';

                            return (
                              <div
                                key={item.id}
                                className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-xs"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  {/* Item info */}
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                                      {item.description}
                                    </p>
                                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                                      {/* Specific attributes displays */}
                                      {(() => {
                                        const key = getCategoryKey(category.name);
                                        if (key === 'PROJECTS') {
                                          return (
                                            <span>
                                              {item.quantity} semestre(s)
                                              {item.isInArea && ' · Na área de pesquisa'}
                                            </span>
                                          );
                                        }
                                        if (key === 'PRODUCTION') {
                                          const details = [];
                                          if (
                                            item.classification &&
                                            item.classification !== 'none'
                                          ) {
                                            details.push(`Qualis ${item.classification}`);
                                          } else {
                                            details.push('Sem Qualis');
                                          }
                                          if (item.isComplete) details.push('Artigo completo');
                                          if (item.isResumo) details.push('Resumo/pôster');
                                          if (item.isPeriodico) details.push('Periódico');
                                          if (item.isAutorPrincipal)
                                            details.push('Autor principal');
                                          if (item.isDissertacao)
                                            details.push('Fruto de dissertação');
                                          if (item.isEncontroIc) details.push('Encontro de IC');
                                          return <span>{details.join(' · ')}</span>;
                                        }
                                        if (key === 'TEACHING') {
                                          return (
                                            <span>
                                              {item.quantity} semestre(s)
                                              {enrollment.level === 'masters' &&
                                                ` · ${item.docenciaType === 'ies' ? 'Docente IES' : 'Monitoria'}`}
                                            </span>
                                          );
                                        }
                                        if (key === 'EVENTS') {
                                          const scope =
                                            item.eventoType === 'internacional'
                                              ? 'Internacional'
                                              : item.eventoType === 'nacional'
                                                ? 'Nacional'
                                                : 'Local';
                                          return <span>Apresentação {scope}</span>;
                                        }
                                        if (key === 'ORIENTATION') {
                                          return <span>{item.quantity} aluno-semestre(s)</span>;
                                        }
                                        return <span>Qtd: {item.quantity}</span>;
                                      })()}

                                      {/* Proof File name if present */}
                                      {item.proofFileName && (
                                        <span className="text-slate-400">
                                          · {item.proofFileName}
                                        </span>
                                      )}

                                      {item.score !== null && (
                                        <span className="font-semibold text-primary">
                                          · {parseFloat(item.score).toFixed(1)} pts
                                        </span>
                                      )}
                                    </div>

                                    {/* Correction Details if Incorrect */}
                                    {isItemIncorrect && (
                                      <div className="mt-2 bg-red-50/50 border border-red-100 rounded-xl p-3 text-xs space-y-1">
                                        <p className="font-semibold text-red-800">
                                          Motivo de erro anotado:
                                        </p>
                                        <p className="text-red-700 leading-normal italic">
                                          "
                                          {item.verificationComment ||
                                            'Sem comentários adicionais.'}
                                          "
                                        </p>
                                        {item.correctedClassification &&
                                          item.correctedClassification !== 'none' && (
                                            <p className="text-red-700 font-medium pt-1">
                                              Classificação corrigida pelo docente:{' '}
                                              <Badge
                                                variant="outline"
                                                className="border-red-200 bg-red-100/50 text-red-700 text-[10px] font-bold py-0"
                                              >
                                                {item.correctedClassification}
                                              </Badge>
                                            </p>
                                          )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Right side: item verification status & download */}
                                  <div className="flex flex-col items-end gap-2 shrink-0">
                                    {item.proofFileId ? (
                                      <Button
                                        onClick={() => handleDownloadProof(item.id)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 rounded-lg gap-1.5 text-slate-500 hover:text-slate-900 border border-slate-100 hover:bg-slate-50"
                                      >
                                        <FileText className="h-3.5 w-3.5" />
                                        Comprovante
                                      </Button>
                                    ) : (
                                      <span className="text-[10px] text-red-500 font-medium">
                                        Sem comprovante
                                      </span>
                                    )}

                                    {/* Status Badge */}
                                    {isItemPending && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                        <Clock className="h-3 w-3" />
                                        Pendente
                                      </span>
                                    )}
                                    {isItemVerified && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Validado
                                      </span>
                                    )}
                                    {isItemIncorrect && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                        <XCircle className="h-3 w-3" />
                                        Incorreto
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Verification form drawer/container */}
                                {isCorrecting ? (
                                  <div className="mt-3 bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-4">
                                    <h4 className="text-xs font-bold text-slate-700">
                                      Registrar Inconsistência no Item
                                    </h4>

                                    {getCategoryKey(category.name) === 'PRODUCTION' && (
                                      <div className="space-y-1.5">
                                        <Label
                                          htmlFor="corrected-classification"
                                          className="text-xs font-semibold text-slate-600"
                                        >
                                          Classificação CAPES Correta (Caso queira re-pontuar)
                                        </Label>
                                        <select
                                          id="corrected-classification"
                                          className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-hidden"
                                          value={correctedClassification}
                                          onChange={e => setCorrectedClassification(e.target.value)}
                                        >
                                          <option value="none">Nenhum / Zerar pontuação</option>
                                          <option value="A1">A1</option>
                                          <option value="A2">A2</option>
                                          <option value="A3">A3</option>
                                          <option value="A4">A4</option>
                                          <option value="A5">A5</option>
                                          <option value="A6">A6</option>
                                          <option value="A7">A7</option>
                                          <option value="A8">A8</option>
                                        </select>
                                      </div>
                                    )}

                                    <div className="space-y-1.5">
                                      <Label
                                        htmlFor="verification-comment"
                                        className="text-xs font-semibold text-slate-600"
                                      >
                                        Comentário / Justificativa para o candidato
                                      </Label>
                                      <textarea
                                        id="verification-comment"
                                        rows={3}
                                        placeholder="Descreva o motivo pelo qual este item está incorreto (ex: comprovante inválido, classificação errada)"
                                        className="flex min-h-16 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
                                        value={verificationComment}
                                        onChange={e => setVerificationComment(e.target.value)}
                                      />
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Button
                                        onClick={handleSaveCorrection}
                                        size="sm"
                                        className="h-8 text-xs gap-1"
                                        disabled={verifyCvItem.isPending}
                                      >
                                        {verifyCvItem.isPending ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Check className="h-3.5 w-3.5" />
                                        )}
                                        Confirmar Erro
                                      </Button>
                                      <Button
                                        onClick={() => setCorrectingItemId(null)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-xs border border-slate-100 hover:bg-slate-50"
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Verification actions buttons */
                                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-50 pt-2.5">
                                    <Button
                                      onClick={() => handleVerifyItem(item.id, 'verified')}
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-xs rounded-lg gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 border border-transparent hover:border-green-100"
                                      disabled={verifyCvItem.isPending}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      Validar
                                    </Button>
                                    <Button
                                      onClick={() => handleVerifyItem(item.id, 'incorrect')}
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-xs rounded-lg gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100"
                                      disabled={verifyCvItem.isPending}
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      Incorreto
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-slate-400 italic py-2">
                            Nenhum item cadastrado nesta categoria.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm text-slate-400">
                  Nenhuma categoria de pontuação encontrada.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
