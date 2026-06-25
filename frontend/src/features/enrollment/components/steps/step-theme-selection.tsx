import { useState } from 'react';

import { AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useResearchThemes,
  useUpdateEnrollmentThemes,
} from '@/features/enrollment/hooks/use-enrollment';
import type { Enrollment, EnrollmentPeriod } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Props ────────────────────────────────────────────────────────────

interface StepThemeSelectionProps {
  enrollment: Enrollment | null;
  period: EnrollmentPeriod;
  onNext: () => void;
  onBack?: () => void;
}

// ── Component ────────────────────────────────────────────────────────

export function StepThemeSelection({ enrollment, onNext, onBack }: StepThemeSelectionProps) {
  const updateThemesMutation = useUpdateEnrollmentThemes();

  const [primaryThemeId, setPrimaryThemeId] = useState<string>(enrollment?.primaryThemeId ?? '');
  const [secondaryThemeId, setSecondaryThemeId] = useState<string>(
    enrollment?.secondaryThemeId ?? '',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedThemeIds, setExpandedThemeIds] = useState<Set<string>>(new Set());

  // Fetch all research themes for this level
  const { data: themesResponse, isLoading } = useResearchThemes(
    enrollment?.level as 'masters' | 'doctoral',
  );
  const themes = themesResponse?.data ?? [];

  // Filter themes based on search query
  const filteredThemes = themes.filter(theme => {
    const titleMatch = theme.title.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = theme.description.toLowerCase().includes(searchQuery.toLowerCase());
    const profName =
      `${theme.professor?.firstName ?? ''} ${theme.professor?.lastName ?? ''}`.toLowerCase();
    const profMatch = profName.includes(searchQuery.toLowerCase());

    return titleMatch || descMatch || profMatch;
  });

  const toggleExpand = (themeId: string) => {
    const next = new Set(expandedThemeIds);
    if (next.has(themeId)) {
      next.delete(themeId);
    } else {
      next.add(themeId);
    }
    setExpandedThemeIds(next);
  };

  const isSaving = updateThemesMutation.isPending;

  const handleSave = () => {
    if (!enrollment) return;

    if (!primaryThemeId) {
      toast.error('Por favor, selecione a primeira opção de tema.');
      return;
    }

    if (secondaryThemeId && primaryThemeId === secondaryThemeId) {
      toast.error('A primeira e a segunda opção de tema devem ser diferentes.');
      return;
    }

    updateThemesMutation.mutate(
      {
        id: enrollment.id,
        payload: {
          primaryThemeId,
          secondaryThemeId: secondaryThemeId || null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Temas de pesquisa salvos com sucesso.');
          onNext();
        },
        onError: err => {
          toast.error(err.message || 'Erro ao salvar opções de tema.');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Heading ────────────────────────────────────────────── */}
      <div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Temas de Pesquisa</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Selecione a primeira e segunda opção de tema de pesquisa desejados para orientações.
        </p>
      </div>

      {/* ── Selection Dropdowns ─────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="primary-theme">Primeira Opção de Tema</FieldLabel>
          <FieldContent>
            <Select value={primaryThemeId} onValueChange={setPrimaryThemeId}>
              <SelectTrigger id="primary-theme">
                <SelectValue placeholder="Selecione o tema principal..." />
              </SelectTrigger>
              <SelectContent>
                {themes.map(theme => (
                  <SelectItem
                    key={theme.id}
                    value={theme.id}
                    disabled={theme.id === secondaryThemeId}
                  >
                    {theme.title} ({theme.professor?.firstName} {theme.professor?.lastName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="secondary-theme">Segunda Opção de Tema (opcional)</FieldLabel>
          <FieldContent>
            <Select value={secondaryThemeId} onValueChange={setSecondaryThemeId}>
              <SelectTrigger id="secondary-theme">
                <SelectValue placeholder="Selecione o tema secundário..." />
              </SelectTrigger>
              <SelectContent>
                {themes.map(theme => (
                  <SelectItem
                    key={theme.id}
                    value={theme.id}
                    disabled={theme.id === primaryThemeId}
                  >
                    {theme.title} ({theme.professor?.firstName} {theme.professor?.lastName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>
      </div>

      {primaryThemeId && secondaryThemeId && primaryThemeId === secondaryThemeId && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          <span>A primeira e a segunda opção de tema não podem ser iguais.</span>
        </div>
      )}

      {/* ── Search bar ─────────────────────────────────────────── */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-3.5 left-4 h-4 w-4" />
        <Input
          placeholder="Buscar tema por título, orientador ou descrição..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-11"
        />
      </div>

      {/* ── Themes List ────────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredThemes.length > 0 ? (
          filteredThemes.map(theme => {
            const isSelectedPrimary = primaryThemeId === theme.id;
            const isSelectedSecondary = secondaryThemeId === theme.id;
            const isExpanded = expandedThemeIds.has(theme.id);

            return (
              <Card
                key={theme.id}
                className={cn(
                  'transition-all duration-200',
                  isSelectedPrimary &&
                    'ring-2 ring-emerald-500 bg-emerald-50/10 border-emerald-200',
                  isSelectedSecondary && 'ring-2 ring-blue-500 bg-blue-50/10 border-blue-200',
                )}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-serif text-lg font-semibold text-foreground">
                          {theme.title}
                        </h4>
                        {isSelectedPrimary && (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">
                            1ª Opção
                          </Badge>
                        )}
                        {isSelectedSecondary && (
                          <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none">
                            2ª Opção
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Orientador:{' '}
                        <span className="font-semibold text-foreground">
                          {theme.professor?.firstName} {theme.professor?.lastName}
                        </span>
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(theme.id)}
                      className="text-muted-foreground"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <p
                    className={cn(
                      'text-sm leading-relaxed text-muted-foreground',
                      !isExpanded && 'line-clamp-2',
                    )}
                  >
                    {theme.description}
                  </p>

                  {isExpanded && (
                    <div className="border-t pt-4 space-y-3">
                      <div>
                        <span className="text-xs text-muted-foreground font-semibold">
                          Vagas disponíveis:
                        </span>
                        <p className="text-sm font-medium">{theme.vacancies}</p>
                      </div>

                      {theme.associatedProfessors && theme.associatedProfessors.length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground font-semibold">
                            Coorientadores:
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {theme.associatedProfessors.map(p => (
                              <Badge key={p.id} variant="outline" className="text-xs font-normal">
                                {p.firstName} {p.lastName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {theme.references && theme.references.length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground font-semibold">
                            Referências recomendadas:
                          </span>
                          <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground mt-1">
                            {theme.references.map((ref, idx) => (
                              <li key={idx}>
                                {ref.url ? (
                                  <a
                                    href={ref.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline font-medium"
                                  >
                                    {ref.name}
                                  </a>
                                ) : (
                                  ref.name
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      size="sm"
                      variant={isSelectedPrimary ? 'default' : 'outline'}
                      onClick={() => {
                        if (isSelectedPrimary) {
                          setPrimaryThemeId('');
                        } else {
                          setPrimaryThemeId(theme.id);
                          if (secondaryThemeId === theme.id) {
                            setSecondaryThemeId('');
                          }
                        }
                      }}
                      className={cn(
                        isSelectedPrimary &&
                          'bg-emerald-500 hover:bg-emerald-600 text-white border-none',
                      )}
                    >
                      Selecionar como 1ª Opção
                    </Button>
                    <Button
                      size="sm"
                      variant={isSelectedSecondary ? 'default' : 'outline'}
                      onClick={() => {
                        if (isSelectedSecondary) {
                          setSecondaryThemeId('');
                        } else {
                          setSecondaryThemeId(theme.id);
                          if (primaryThemeId === theme.id) {
                            setPrimaryThemeId('');
                          }
                        }
                      }}
                      className={cn(
                        isSelectedSecondary &&
                          'bg-blue-500 hover:bg-blue-600 text-white border-none',
                      )}
                    >
                      Selecionar como 2ª Opção
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-center text-sm text-muted-foreground py-6">
            Nenhum tema encontrado com o termo de busca.
          </p>
        )}
      </div>

      {/* ── Footer Navigation ──────────────────────────────────── */}
      <div className="flex items-center justify-between border-t pt-6">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack} disabled={isSaving}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={
            isSaving ||
            !primaryThemeId ||
            (!!secondaryThemeId && primaryThemeId === secondaryThemeId)
          }
          className="ml-auto"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar e Continuar
        </Button>
      </div>
    </div>
  );
}
