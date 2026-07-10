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
import type { CvItem, ScoringCategory, VerifyCvItemPayload } from '@/lib/api';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { useUpdateEnrollment } from '@/features/enrollment/hooks/use-enrollment';

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
  const { data: user } = useAuth();
  const updateEnrollment = useUpdateEnrollment();

  // ── Local states for verification ──────────────────────────────────
  const [draftStatuses, setDraftStatuses] = React.useState<Record<string, 'accepted' | 'partial' | 'rejected' | ''>>({});
  const [draftScores, setDraftScores] = React.useState<Record<string, string>>({});
  const [draftJustifications, setDraftJustifications] = React.useState<Record<string, string>>({});
  const [savingItems, setSavingItems] = React.useState<Record<string, boolean>>({});

  // MEC Factor override states
  const [isEditingMec, setIsEditingMec] = React.useState(false);
  const [mecFactorInput, setMecFactorInput] = React.useState('');

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

  const handleDownloadUndergradProof = async () => {
    try {
      const { url } = await api.enrollments.getUndergradProofInfo(id);
      window.open(url, '_blank');
    } catch {
      toast.error('Erro ao obter histórico acadêmico de graduação.');
    }
  };

  const handleDownloadProjectFile = async () => {
    try {
      const { url } = await api.enrollments.getProjectFileInfo(id);
      window.open(url, '_blank');
    } catch {
      toast.error('Erro ao obter o projeto de pesquisa.');
    }
  };

  const handleSaveItemVerification = (
    itemId: string,
    status: 'accepted' | 'partial' | 'rejected',
    adjustedScore?: number,
    justification?: string,
  ) => {
    setSavingItems(prev => ({ ...prev, [itemId]: true }));
    verifyCvItem.mutate(
      {
        enrollmentId: id,
        itemId,
        payload: { status, adjustedScore, justification },
      },
      {
        onSuccess: () => {
          toast.success('Avaliação de item salva com sucesso.');
          setSavingItems(prev => ({ ...prev, [itemId]: false }));
          // Clear draft states
          setDraftStatuses(prev => {
            const copy = { ...prev };
            delete copy[itemId];
            return copy;
          });
          setDraftScores(prev => {
            const copy = { ...prev };
            delete copy[itemId];
            return copy;
          });
          setDraftJustifications(prev => {
            const copy = { ...prev };
            delete copy[itemId];
            return copy;
          });
        },
        onError: err => {
          toast.error(err.message || 'Erro ao salvar avaliação.');
          setSavingItems(prev => ({ ...prev, [itemId]: false }));
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
                <p className="font-medium text-slate-800">
                  {enrollment?.undergradUniversity ?? candidate?.universityOfOrigin ?? '—'}
                </p>
              </div>

              {enrollment?.undergradCourse && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Curso de Origem
                  </span>
                  <p className="font-medium text-slate-800 capitalize">
                    {enrollment.undergradCourse}
                    {enrollment.undergradDegreeType && ` (${enrollment.undergradDegreeType})`}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  IRA do Candidato
                </span>
                <p className="font-semibold text-slate-800 text-lg">
                  {enrollment?.ira
                    ? parseFloat(enrollment.ira).toFixed(2)
                    : candidate?.ira
                      ? parseFloat(candidate.ira).toFixed(2)
                      : '—'}
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-50">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Nota MEC do Curso
                </span>
                <p className="font-medium text-slate-800">
                  {enrollment?.mecScore !== null && enrollment?.mecScore !== undefined ? (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      Nota {enrollment.mecScore}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      Sem Nota Cadastrada (Usa Fator Padrão)
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-50">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Fator MEC
                </span>
                {isEditingMec ? (
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      className="flex h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-hidden"
                      value={mecFactorInput}
                      onChange={e => setMecFactorInput(e.target.value)}
                    >
                      <option value="1.00">1.00 (Nota MEC 5)</option>
                      <option value="0.80">0.80 (Nota MEC 4)</option>
                      <option value="0.60">0.60 (Nota MEC 3 / Sem Nota)</option>
                      <option value="0.40">0.40 (Nota MEC 2)</option>
                      <option value="0.20">0.20 (Nota MEC 1)</option>
                      <option value="custom">Outro valor...</option>
                    </select>

                    {mecFactorInput === 'custom' || !['1.00', '0.80', '0.60', '0.40', '0.20'].includes(mecFactorInput) ? (
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="1.0"
                        placeholder="Ex: 0.75"
                        className="flex h-8 w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-hidden font-mono"
                        value={mecFactorInput === 'custom' ? '' : mecFactorInput}
                        onChange={e => setMecFactorInput(e.target.value)}
                      />
                    ) : null}

                    <Button
                      size="sm"
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={updateEnrollment.isPending}
                      onClick={() => {
                        const factorNum = parseFloat(mecFactorInput);
                        if (isNaN(factorNum) || factorNum < 0.1 || factorNum > 1.0) {
                          toast.error('O fator deve ser um número entre 0.1 e 1.0.');
                          return;
                        }
                        updateEnrollment.mutate(
                          { id, payload: { mecFactor: factorNum.toFixed(2) } },
                          {
                            onSuccess: () => {
                              toast.success('Fator MEC atualizado com sucesso.');
                              setIsEditingMec(false);
                            },
                            onError: () => {
                              toast.error('Erro ao atualizar o Fator MEC.');
                            },
                          }
                        );
                      }}
                    >
                      Salvar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs border border-slate-100"
                      disabled={updateEnrollment.isPending}
                      onClick={() => setIsEditingMec(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800 text-base font-mono">
                      {enrollment?.mecFactor
                        ? parseFloat(enrollment.mecFactor).toFixed(2)
                        : '0.60'}
                    </p>
                    {user && user.role !== 'candidate' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-primary hover:bg-primary/5 px-2"
                        onClick={() => {
                          setMecFactorInput(enrollment?.mecFactor ? parseFloat(enrollment.mecFactor).toFixed(2) : '0.60');
                          setIsEditingMec(true);
                        }}
                      >
                        Ajustar Fator
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-50">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  IRA Ajustado (Fator MEC aplicado)
                </span>
                <p className="font-bold text-primary text-xl font-mono">
                  {enrollment?.iraAdjusted
                    ? parseFloat(enrollment.iraAdjusted).toFixed(2)
                    : enrollment?.ira
                      ? (parseFloat(enrollment.ira) * parseFloat(enrollment.mecFactor || '0.60')).toFixed(2)
                      : '—'}
                </p>
                <span className="text-[10px] text-slate-400 block leading-none">
                  Fórmula: IRA Declarado × Fator MEC
                </span>
              </div>

              {/* Comprovante de Graduação / Histórico */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Histórico de Graduação
                </span>
                {enrollment.undergradProofFileId ? (
                  <Button
                    onClick={handleDownloadUndergradProof}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 rounded-xl text-slate-700 border-slate-200"
                  >
                    <Download className="h-4 w-4" />
                    Baixar histórico de graduação
                  </Button>
                ) : (
                  <p className="text-xs text-red-500 flex items-center gap-1.5 pt-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Histórico acadêmico não enviado
                  </p>
                )}
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
                  Candidato não cadastrou o POSCOMP
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

          {/* Projeto de Pesquisa (if doctoral) */}
          {enrollment.level === 'doctoral' && (
            <Card className="rounded-3xl border border-slate-100 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="text-lg font-serif font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Projeto de Pesquisa
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Título do Projeto
                  </span>
                  <p className="font-medium text-slate-800 leading-snug">
                    {enrollment.projectTitle || '—'}
                  </p>
                </div>
                {enrollment.projectFileId ? (
                  <Button
                    onClick={handleDownloadProjectFile}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 rounded-xl text-slate-700 border-slate-200"
                  >
                    <Download className="h-4 w-4" />
                    Baixar projeto de pesquisa
                  </Button>
                ) : (
                  <p className="text-xs text-red-500 flex items-center gap-1.5 pt-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Projeto de pesquisa não enviado
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
                            const isItemPending = item.verificationStatus === 'pending';
                            const isItemVerified = item.verificationStatus === 'accepted';
                            const isItemAdjusted = item.verificationStatus === 'partial';
                            const isItemRejected = item.verificationStatus === 'rejected';

                            const isSaving = savingItems[item.id];
                            const currentStatus = draftStatuses[item.id] ?? (item.verificationStatus !== 'pending' ? item.verificationStatus : '');
                            const currentScore = draftScores[item.id] ?? (item.adjustedScore !== null ? item.adjustedScore : (item.score ?? '0'));
                            const currentJustification = draftJustifications[item.id] ?? (item.verificationJustification ?? '');

                            const hasLocalChanges =
                              currentStatus !== (item.verificationStatus !== 'pending' ? item.verificationStatus : '') ||
                              (currentStatus === 'partial' && currentScore !== (item.adjustedScore ?? '')) ||
                              currentJustification !== (item.verificationJustification ?? '');

                            const declared = item.score !== null ? parseFloat(item.score) : item.quantity * parseFloat(category.pointsPerItem);

                            const isScoreValid = currentStatus === 'partial' ? !isNaN(parseFloat(currentScore)) && parseFloat(currentScore) >= 0 : true;
                            const isJustificationRequired = (currentStatus === 'partial' || currentStatus === 'rejected') && parseFloat(currentScore) !== declared;
                            const isJustificationValid = isJustificationRequired ? currentJustification.trim().length > 0 : true;
                            const isValid = currentStatus !== '' && isScoreValid && isJustificationValid;

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

                                    {/* Correction Details if Incorrect/Adjusted/Rejected */}
                                    {(isItemAdjusted || isItemRejected) && (
                                      <div className="mt-2 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-1">
                                        <p className="font-semibold text-slate-800">
                                          Justificativa do ajuste/rejeição:
                                        </p>
                                        <p className="text-slate-600 leading-normal italic">
                                          "{item.verificationJustification || 'Sem justificativa.'}"
                                        </p>
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
                                    {item.verificationStatus !== 'pending' && (
                                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                        {item.verificationStatus === 'accepted' && (
                                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center">
                                            <Check className="h-3 w-3 mr-1" />
                                            Aceito ({declared.toFixed(1)} pts)
                                          </span>
                                        )}
                                        {item.verificationStatus === 'partial' && (
                                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            Ajustado ({parseFloat(item.adjustedScore || '0').toFixed(1)} pts)
                                          </span>
                                        )}
                                        {item.verificationStatus === 'rejected' && (
                                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 flex items-center">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            Rejeitado
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {item.verificationStatus === 'pending' && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                        <Clock className="h-3 w-3" />
                                        Pendente
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Verification form drawer/container (Staff Only) */}
                                {user && user.role !== 'candidate' && (
                                  <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-semibold text-slate-500 mr-2">Avaliação do Item:</span>
                                      <Button
                                        type="button"
                                        variant={currentStatus === 'accepted' ? 'default' : 'outline'}
                                        size="xs"
                                        className={`h-7 text-[10px] px-2.5 ${
                                          currentStatus === 'accepted'
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                        onClick={() => {
                                          setDraftStatuses(prev => ({ ...prev, [item.id]: 'accepted' }));
                                          setDraftScores(prev => ({ ...prev, [item.id]: declared.toString() }));
                                        }}
                                      >
                                        Aceitar Nota
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={currentStatus === 'partial' ? 'default' : 'outline'}
                                        size="xs"
                                        className={`h-7 text-[10px] px-2.5 ${
                                          currentStatus === 'partial'
                                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                        onClick={() => {
                                          setDraftStatuses(prev => ({ ...prev, [item.id]: 'partial' }));
                                        }}
                                      >
                                        Ajustar Nota
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={currentStatus === 'rejected' ? 'default' : 'outline'}
                                        size="xs"
                                        className={`h-7 text-[10px] px-2.5 ${
                                          currentStatus === 'rejected'
                                            ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                        onClick={() => {
                                          setDraftStatuses(prev => ({ ...prev, [item.id]: 'rejected' }));
                                          setDraftScores(prev => ({ ...prev, [item.id]: '0' }));
                                        }}
                                      >
                                        Rejeitar Item
                                      </Button>
                                    </div>

                                    {/* Adjusted Score Input (if partial status selected) */}
                                    {currentStatus === 'partial' && (
                                      <div className="flex flex-col gap-1 max-w-[150px]">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nota Validada:</label>
                                        <Input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max={declared}
                                          className="h-8 font-mono text-xs border-slate-200"
                                          value={currentScore}
                                          onChange={e => setDraftScores(prev => ({ ...prev, [item.id]: e.target.value }))}
                                        />
                                      </div>
                                    )}

                                    {/* Justification Textarea (if partial or rejected selected) */}
                                    {(currentStatus === 'partial' || currentStatus === 'rejected') && (
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                                          <span>Justificativa da Alteração:</span>
                                          <span className="text-[9px] text-rose-500 font-normal">* Obrigatória</span>
                                        </label>
                                        <textarea
                                          rows={2}
                                          placeholder="Descreva a razão de ajustar ou rejeitar a pontuação..."
                                          className={`flex min-h-12 w-full rounded-md border bg-white px-3 py-1.5 text-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary ${
                                            isJustificationRequired && !currentJustification.trim()
                                              ? 'border-rose-300 focus-visible:ring-rose-500'
                                              : 'border-slate-200'
                                          }`}
                                          value={currentJustification}
                                          onChange={e => setDraftJustifications(prev => ({ ...prev, [item.id]: e.target.value }))}
                                        />
                                      </div>
                                    )}

                                    {/* Action buttons if changes exist */}
                                    {hasLocalChanges && (
                                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                        <Button
                                          size="sm"
                                          className="bg-primary text-white text-[10px] h-7 gap-1"
                                          disabled={isSaving || !isValid}
                                          onClick={() => {
                                            const scoreVal = currentStatus === 'partial' ? parseFloat(currentScore) : currentStatus === 'rejected' ? 0 : declared;
                                            handleSaveItemVerification(
                                              item.id,
                                              currentStatus as 'accepted' | 'partial' | 'rejected',
                                              scoreVal,
                                              currentJustification
                                            );
                                          }}
                                        >
                                          {isSaving ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Check className="h-3.5 w-3.5" />
                                          )}
                                          Salvar
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 text-[10px] text-slate-500"
                                          disabled={isSaving}
                                          onClick={() => {
                                            // Reset local state to item values
                                            setDraftStatuses(prev => {
                                              const copy = { ...prev };
                                              delete copy[item.id];
                                              return copy;
                                            });
                                            setDraftScores(prev => {
                                              const copy = { ...prev };
                                              delete copy[item.id];
                                              return copy;
                                            });
                                            setDraftJustifications(prev => {
                                              const copy = { ...prev };
                                              delete copy[item.id];
                                              return copy;
                                            });
                                          }}
                                        >
                                          Cancelar
                                        </Button>
                                      </div>
                                    )}
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
