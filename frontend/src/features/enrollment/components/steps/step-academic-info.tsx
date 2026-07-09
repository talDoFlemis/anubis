import { useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CourseCombobox } from '@/features/enrollment/components/CourseCombobox';
import { FileUploadField } from '@/features/enrollment/components/file-upload-field';
import { UniversityCombobox } from '@/features/enrollment/components/UniversityCombobox';
import {
  useUpdateEnrollment,
  useUpdateMastersDegrees,
} from '@/features/enrollment/hooks/use-enrollment';
import type {
  Enrollment,
  EnrollmentPeriod,
  MastersDegreeData,
  UndergradDegreeType,
} from '@/lib/api';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Undergrad degree type options ────────────────────────────────────

const UNDERGRAD_DEGREE_TYPES: { value: UndergradDegreeType; label: string }[] = [
  { value: 'bacharelado', label: 'Bacharelado' },
  { value: 'licenciatura', label: 'Licenciatura' },
  { value: 'tecnologo', label: 'Tecnólogo' },
];

// ── IRA validation ───────────────────────────────────────────────────

const IRA_PATTERN = /^\d{1,2}(\.\d{1,2})?$/;

// ── Props ────────────────────────────────────────────────────────────

interface StepAcademicInfoProps {
  enrollment: Enrollment | null;
  period: EnrollmentPeriod;
  onNext: () => void;
  onBack?: () => void;
}

// ── Masters degree entry helpers ─────────────────────────────────────

interface MastersDegreeEntry {
  university: string;
  graduateProgram: string;
  ira: string;
  isPrimary: boolean;
  proofFileId?: string;
}

function createEmptyEntry(isPrimary = false): MastersDegreeEntry {
  return { university: '', graduateProgram: '', ira: '', isPrimary };
}

const JUSTIFICATION_MAX_LENGTH = 2000;

// ── Phone mask ───────────────────────────────────────────────────────

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ── Component ────────────────────────────────────────────────────────

export function StepAcademicInfo({ enrollment, onNext, onBack }: StepAcademicInfoProps) {
  const queryClient = useQueryClient();
  const updateEnrollment = useUpdateEnrollment();
  const updateMastersDegrees = useUpdateMastersDegrees();

  const isDoctoralLevel = enrollment?.level === 'doctoral';

  // ── Local state ──────────────────────────────────────────────────
  const [undergradUniversityId, setUndergradUniversityId] = useState<string | null>(
    enrollment?.undergradUniversityId ?? null,
  );
  const [undergradUniversityLabel, setUndergradUniversityLabel] = useState<string | null>(
    enrollment?.undergradUniversity ?? null,
  );
  const [undergradCourseId, setUndergradCourseId] = useState<string | null>(
    enrollment?.undergradCourseId ?? null,
  );
  const [undergradCourseLabel, setUndergradCourseLabel] = useState<string | null>(
    enrollment?.undergradCourse ?? null,
  );
  const [undergradDegreeType, setUndergradDegreeType] = useState<UndergradDegreeType | ''>(
    enrollment?.undergradDegreeType ?? '',
  );
  const [ira, setIra] = useState(enrollment?.ira ?? '');
  const [phone, setPhone] = useState(enrollment?.phone ?? '');
  const [justification, setJustification] = useState(enrollment?.justification ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Undergrad conclusion proof ───────────────────────────────────
  const [undergradProofFile, setUndergradProofFile] = useState<File | null>(null);
  const [undergradProofName, setUndergradProofName] = useState<string | null>(null);
  const hasExistingUndergradProof = !!enrollment?.undergradProofFileId;

  useEffect(() => {
    if (hasExistingUndergradProof && enrollment) {
      api.enrollments
        .getUndergradProofInfo(enrollment.id)
        .then(info => setUndergradProofName(info.fileName))
        .catch(() => {});
    }
  }, [hasExistingUndergradProof, enrollment]);

  // ── Masters degree proofs (pending uploads, doctoral only) ───────
  const [mastersProofFiles, setMastersProofFiles] = useState<Record<number, File>>({});

  // ── Doctoral project (doctoral only) ─────────────────────────────
  const [projectTitle, setProjectTitle] = useState(enrollment?.projectTitle ?? '');
  const [projectFile, setProjectFile] = useState<File | null>(null);
  const hasExistingProjectFile = !!enrollment?.projectFileId;

  // ── Masters degrees state (doctoral only) ────────────────────────
  const [mastersDegrees, setMastersDegrees] = useState<MastersDegreeEntry[]>(() => {
    if (enrollment?.mastersDegrees?.length) {
      return enrollment.mastersDegrees.map(md => ({
        university: md.university,
        graduateProgram: md.graduateProgram,
        ira: String(md.ira),
        isPrimary: md.isPrimary,
        proofFileId: md.proofFileId,
      }));
    }
    return isDoctoralLevel ? [createEmptyEntry(true)] : [];
  });

  // ── Masters degree list operations ───────────────────────────────
  function addMastersDegreeEntry() {
    setMastersDegrees(prev => [...prev, createEmptyEntry()]);
  }

  function removeMastersDegreeEntry(index: number) {
    setMastersDegrees(prev => {
      const next = prev.filter((_, i) => i !== index);
      // Ensure at least one entry and one primary
      if (next.length > 0 && !next.some(e => e.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
    // Keep pending proof uploads aligned with the new indexes: drop the
    // removed entry's file and shift later keys down by one.
    setMastersProofFiles(prev => {
      const next: Record<number, File> = {};
      for (const [key, file] of Object.entries(prev)) {
        const i = Number(key);
        if (i === index) continue;
        next[i > index ? i - 1 : i] = file;
      }
      return next;
    });
  }

  function updateMastersEntry(
    index: number,
    field: keyof MastersDegreeEntry,
    value: string | boolean,
  ) {
    setMastersDegrees(prev =>
      prev.map((entry, i) => {
        if (i !== index) {
          // If toggling primary, unset others
          if (field === 'isPrimary' && value === true) {
            return { ...entry, isPrimary: false };
          }
          return entry;
        }
        return { ...entry, [field]: value };
      }),
    );
  }

  // ── Validation ───────────────────────────────────────────────────
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!undergradUniversityId) {
      newErrors.undergradUniversity = 'A universidade de graduação é obrigatória.';
    }

    if (!undergradCourseId) {
      newErrors.undergradCourse = 'O curso de graduação é obrigatório.';
    }

    if (!undergradDegreeType) {
      newErrors.undergradDegreeType = 'O tipo de graduação é obrigatório.';
    }

    if (!ira.trim()) {
      newErrors.ira = 'O IRA é obrigatório.';
    } else if (!IRA_PATTERN.test(ira.trim())) {
      newErrors.ira = 'IRA deve ser um número válido (ex.: 8.75).';
    } else if (Number(ira) < 0 || Number(ira) > 10) {
      newErrors.ira = 'IRA deve estar entre 0 e 10.';
    }

    if (!undergradProofFile && !enrollment?.undergradProofFileId) {
      newErrors.undergradProof = 'O comprovante de conclusão da graduação é obrigatório.';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório.';
    }

    if (!justification.trim()) {
      newErrors.justification = 'Justificativa é obrigatória.';
    } else if (justification.length > JUSTIFICATION_MAX_LENGTH) {
      newErrors.justification = `Justificativa não pode exceder ${JUSTIFICATION_MAX_LENGTH} caracteres.`;
    }

    if (isDoctoralLevel) {
      if (mastersDegrees.length === 0) {
        newErrors.mastersDegrees = 'Pelo menos um mestrado é obrigatório.';
      } else {
        const hasPrimary = mastersDegrees.some(e => e.isPrimary);
        if (!hasPrimary) {
          newErrors.mastersDegrees = 'Exatamente um mestrado deve ser marcado como principal.';
        }

        mastersDegrees.forEach((entry, i) => {
          if (!entry.university.trim()) {
            newErrors[`masters_${i}_university`] = 'Universidade é obrigatória.';
          }
          if (!entry.graduateProgram.trim()) {
            newErrors[`masters_${i}_graduateProgram`] = 'Programa de pós-graduação é obrigatório.';
          }
          if (!entry.ira.trim() || isNaN(Number(entry.ira))) {
            newErrors[`masters_${i}_ira`] = 'IRA deve ser um número válido.';
          } else {
            const iraValue = Number(entry.ira);
            if (iraValue < 0 || iraValue > 10) {
              newErrors[`masters_${i}_ira`] = 'IRA deve estar entre 0 e 10.';
            }
          }
          if (!mastersProofFiles[i] && !entry.proofFileId) {
            newErrors[`masters_${i}_proof`] = 'O comprovante do IRA do mestrado é obrigatório.';
          }
        });
      }

      if (!projectTitle.trim()) {
        newErrors.projectTitle = 'O título do projeto é obrigatório.';
      }
      if (!projectFile && !enrollment?.projectFileId) {
        newErrors.projectFile = 'O arquivo PDF do projeto é obrigatório.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ───────────────────────────────────────────────────────
  const isPending = updateEnrollment.isPending || updateMastersDegrees.isPending;

  async function handleNext() {
    if (!validate()) return;
    if (!enrollment) return;

    try {
      await updateEnrollment.mutateAsync({
        id: enrollment.id,
        payload: {
          undergradUniversityId,
          undergradCourseId,
          undergradDegreeType: undergradDegreeType || undefined,
          ira: ira.trim(),
          phone: phone.trim(),
          justification: justification.trim(),
          ...(isDoctoralLevel ? { projectTitle: projectTitle.trim() } : {}),
        },
      });

      // Upload undergrad conclusion proof if a new file was selected
      if (undergradProofFile) {
        await api.enrollments.uploadUndergradProof(enrollment.id, undergradProofFile);
      }

      if (isDoctoralLevel && mastersDegrees.length > 0) {
        const payload: MastersDegreeData[] = mastersDegrees.map(entry => ({
          university: entry.university.trim(),
          graduateProgram: entry.graduateProgram.trim(),
          ira: Number(entry.ira),
          isPrimary: entry.isPrimary,
          proofFileId: entry.proofFileId,
        }));
        await updateMastersDegrees.mutateAsync({
          id: enrollment.id,
          payload: { mastersDegrees: payload },
        });

        // Upload pending master's degree proofs by index (degrees now persisted)
        for (const [index, file] of Object.entries(mastersProofFiles)) {
          await api.enrollments.uploadMastersDegreeProof(enrollment.id, Number(index), file);
        }
      }

      // Upload doctoral project PDF if a new file was selected
      if (isDoctoralLevel && projectFile) {
        await api.enrollments.uploadProjectFile(enrollment.id, projectFile);
      }

      queryClient.invalidateQueries({ queryKey: ['enrollments', enrollment.id] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'me'] });

      onNext();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar dados acadêmicos.';
      toast.error(message);
    }
  }

  return (
    <div className="space-y-10">
      {/* ── Section heading ────────────────────────────────────── */}
      <div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">Informações acadêmicas</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Preencha as informações complementares da sua inscrição.
        </p>
      </div>

      {/* ── Graduação (undergrad) ──────────────────────────────── */}
      <section className="space-y-5">
        <div>
          <h3 className="font-serif text-xl font-semibold tracking-tight">Graduação</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Informe os dados da sua graduação concluída.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.undergradUniversity} className="space-y-2">
            <FieldLabel htmlFor="undergrad-university">Universidade de graduação</FieldLabel>
            <FieldContent>
              <UniversityCombobox
                selectedId={undergradUniversityId}
                selectedLabel={undergradUniversityLabel}
                onSelect={(id, label) => {
                  setUndergradUniversityId(id);
                  setUndergradUniversityLabel(label);
                  setUndergradCourseId(null);
                  setUndergradCourseLabel(null);
                  setErrors(prev => {
                    const { undergradUniversity: _, ...rest } = prev;
                    return rest;
                  });
                }}
                error={errors.undergradUniversity}
              />
              {errors.undergradUniversity && <FieldError>{errors.undergradUniversity}</FieldError>}
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.undergradCourse} className="space-y-2">
            <FieldLabel htmlFor="undergrad-course">Curso de graduação</FieldLabel>
            <FieldContent>
              <CourseCombobox
                selectedId={undergradCourseId}
                selectedLabel={undergradCourseLabel}
                universityId={undergradUniversityId}
                onSelect={(id, label) => {
                  setUndergradCourseId(id);
                  setUndergradCourseLabel(label);
                  setErrors(prev => {
                    const { undergradCourse: _, ...rest } = prev;
                    return rest;
                  });
                }}
                error={errors.undergradCourse}
              />
              {errors.undergradCourse && <FieldError>{errors.undergradCourse}</FieldError>}
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.undergradDegreeType} className="space-y-2">
            <FieldLabel htmlFor="undergrad-degree-type">Tipo de graduação</FieldLabel>
            <FieldContent>
              <Select
                value={undergradDegreeType}
                onValueChange={value => {
                  setUndergradDegreeType(value as UndergradDegreeType);
                  setErrors(prev => {
                    const { undergradDegreeType: _, ...rest } = prev;
                    return rest;
                  });
                }}
              >
                <SelectTrigger
                  id="undergrad-degree-type"
                  aria-invalid={!!errors.undergradDegreeType}
                >
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {UNDERGRAD_DEGREE_TYPES.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.undergradDegreeType && <FieldError>{errors.undergradDegreeType}</FieldError>}
            </FieldContent>
          </Field>

          <Field data-invalid={!!errors.ira} className="space-y-2">
            <FieldLabel htmlFor="undergrad-ira">IRA</FieldLabel>
            <FieldContent>
              <Input
                id="undergrad-ira"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={ira}
                onChange={e => {
                  setIra(e.target.value);
                  setErrors(prev => {
                    const { ira: _, ...rest } = prev;
                    return rest;
                  });
                }}
                placeholder="Ex.: 8.75"
                aria-invalid={!!errors.ira}
              />
              {errors.ira && <FieldError>{errors.ira}</FieldError>}
            </FieldContent>
          </Field>
        </div>

        <FileUploadField
          label="Comprovante de conclusão da graduação (diploma ou histórico)"
          value={undergradProofFile}
          existingFileName={undergradProofName}
          onChange={file => {
            setUndergradProofFile(file);
            setErrors(prev => {
              const { undergradProof: _, ...rest } = prev;
              return rest;
            });
          }}
          error={errors.undergradProof}
        />
      </section>

      {/* ── Phone field ────────────────────────────────────────── */}
      <Field data-invalid={!!errors.phone} className="space-y-2">
        <FieldLabel htmlFor="phone">Telefone</FieldLabel>
        <FieldContent>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={e => {
              setPhone(formatPhone(e.target.value));
              setErrors(prev => {
                const { phone: _, ...rest } = prev;
                return rest;
              });
            }}
            placeholder="(84) 99999-0000"
            aria-invalid={!!errors.phone}
          />
          {errors.phone && <FieldError>{errors.phone}</FieldError>}
        </FieldContent>
      </Field>

      {/* ── Justification textarea ─────────────────────────────── */}
      <Field data-invalid={!!errors.justification} className="space-y-2">
        <FieldLabel htmlFor="justification">Justificativa</FieldLabel>
        <FieldContent>
          <textarea
            id="justification"
            value={justification}
            onChange={e => {
              setJustification(e.target.value);
              setErrors(prev => {
                const { justification: _, ...rest } = prev;
                return rest;
              });
            }}
            placeholder="Descreva sua motivação para ingressar no programa..."
            rows={6}
            maxLength={JUSTIFICATION_MAX_LENGTH}
            aria-invalid={!!errors.justification}
            className={cn(
              'anubis-ghost-border text-foreground ring-offset-background placeholder:text-muted-foreground/85 focus-visible:ring-ring flex w-full rounded-2xl bg-[rgba(255,255,255,0.94)] px-4 py-3 text-sm leading-relaxed focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              'resize-y min-h-32',
            )}
          />
          <div className="flex items-center justify-between">
            {errors.justification ? <FieldError>{errors.justification}</FieldError> : <span />}
            <span className="text-muted-foreground text-xs tabular-nums">
              {justification.length}/{JUSTIFICATION_MAX_LENGTH}
            </span>
          </div>
        </FieldContent>
      </Field>

      {/* ── Masters degrees (doctoral only) ────────────────────── */}
      {isDoctoralLevel && (
        <section className="space-y-5">
          <div>
            <h3 className="font-serif text-xl font-semibold tracking-tight">
              Mestrado(s) concluído(s)
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Adicione os dados do(s) seu(s) mestrado(s). Marque um como principal.
            </p>
          </div>

          {errors.mastersDegrees && (
            <p role="alert" className="text-destructive text-sm">
              {errors.mastersDegrees}
            </p>
          )}

          <div className="space-y-6">
            {mastersDegrees.map((entry, index) => (
              <div
                key={index}
                className={cn(
                  'bg-surface-dim/40 rounded-2xl p-6 space-y-4',
                  entry.isPrimary && 'ring-primary/20 ring-2 ring-inset',
                )}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={entry.isPrimary}
                      onChange={e => updateMastersEntry(index, 'isPrimary', e.target.checked)}
                      className="accent-primary h-4 w-4 rounded"
                    />
                    Principal
                  </label>

                  {mastersDegrees.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMastersDegreeEntry(index)}
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    data-invalid={!!errors[`masters_${index}_university`]}
                    className="space-y-2"
                  >
                    <FieldLabel htmlFor={`masters-${index}-university`}>Universidade</FieldLabel>
                    <FieldContent>
                      <Input
                        id={`masters-${index}-university`}
                        value={entry.university}
                        onChange={e => updateMastersEntry(index, 'university', e.target.value)}
                        placeholder="Ex.: UFRN"
                        aria-invalid={!!errors[`masters_${index}_university`]}
                      />
                      {errors[`masters_${index}_university`] && (
                        <FieldError>{errors[`masters_${index}_university`]}</FieldError>
                      )}
                    </FieldContent>
                  </Field>

                  <Field
                    data-invalid={!!errors[`masters_${index}_graduateProgram`]}
                    className="space-y-2"
                  >
                    <FieldLabel htmlFor={`masters-${index}-program`}>
                      Programa de pós-graduação
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={`masters-${index}-program`}
                        value={entry.graduateProgram}
                        onChange={e => updateMastersEntry(index, 'graduateProgram', e.target.value)}
                        placeholder="Ex.: PPgSC"
                        aria-invalid={!!errors[`masters_${index}_graduateProgram`]}
                      />
                      {errors[`masters_${index}_graduateProgram`] && (
                        <FieldError>{errors[`masters_${index}_graduateProgram`]}</FieldError>
                      )}
                    </FieldContent>
                  </Field>

                  <Field data-invalid={!!errors[`masters_${index}_ira`]} className="space-y-2">
                    <FieldLabel htmlFor={`masters-${index}-ira`}>IRA</FieldLabel>
                    <FieldContent>
                      <Input
                        id={`masters-${index}-ira`}
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={entry.ira}
                        onChange={e => updateMastersEntry(index, 'ira', e.target.value)}
                        placeholder="Ex.: 8.75"
                        aria-invalid={!!errors[`masters_${index}_ira`]}
                      />
                      {errors[`masters_${index}_ira`] && (
                        <FieldError>{errors[`masters_${index}_ira`]}</FieldError>
                      )}
                    </FieldContent>
                  </Field>
                </div>

                <FileUploadField
                  label="Comprovante do IRA do mestrado (histórico ou diploma)"
                  value={mastersProofFiles[index] ?? null}
                  existingFileName={entry.proofFileId ? 'Comprovante enviado' : null}
                  onChange={file => {
                    setMastersProofFiles(prev => {
                      const next = { ...prev };
                      if (file) {
                        next[index] = file;
                      } else {
                        delete next[index];
                      }
                      return next;
                    });
                    setErrors(prev => {
                      const { [`masters_${index}_proof`]: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                  error={errors[`masters_${index}_proof`]}
                />
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addMastersDegreeEntry} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar mestrado
          </Button>

          {/* ── Doctoral project ──────────────────────────────────── */}
          <div className="space-y-5 pt-2">
            <div>
              <h3 className="font-serif text-xl font-semibold tracking-tight">
                Projeto de pesquisa
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Informe o título e anexe o PDF do seu projeto de doutorado.
              </p>
            </div>

            <Field data-invalid={!!errors.projectTitle} className="space-y-2">
              <FieldLabel htmlFor="project-title">Título do projeto</FieldLabel>
              <FieldContent>
                <Input
                  id="project-title"
                  value={projectTitle}
                  onChange={e => {
                    setProjectTitle(e.target.value);
                    setErrors(prev => {
                      const { projectTitle: _, ...rest } = prev;
                      return rest;
                    });
                  }}
                  placeholder="Ex.: Escalabilidade em blockchains de Proof of Stake"
                  aria-invalid={!!errors.projectTitle}
                />
                {errors.projectTitle && <FieldError>{errors.projectTitle}</FieldError>}
              </FieldContent>
            </Field>

            <FileUploadField
              label="Arquivo do projeto (PDF)"
              accept=".pdf"
              value={projectFile}
              existingFileName={hasExistingProjectFile ? 'Projeto enviado' : null}
              onChange={file => {
                setProjectFile(file);
                setErrors(prev => {
                  const { projectFile: _, ...rest } = prev;
                  return rest;
                });
              }}
              error={errors.projectFile}
            />
          </div>
        </section>
      )}

      {/* ── Navigation ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        ) : (
          <span />
        )}

        <Button type="button" onClick={handleNext} disabled={isPending} className="min-w-32">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Próximo'
          )}
        </Button>
      </div>
    </div>
  );
}
