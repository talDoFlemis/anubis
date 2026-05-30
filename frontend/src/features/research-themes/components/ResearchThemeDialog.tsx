import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProfessorItem } from '@/lib/api/professors';
import type { ResearchTheme, ResearchThemeReference } from '@/lib/api/research-themes';
import { toFieldErrors } from '@/shared/errors/fieldErrors';
import {
  INITIAL_RESEARCH_THEME_FORM,
  researchThemeFormSchema,
  type ResearchThemeFormData,
} from '../types/research-themes-form.types';

interface ResearchThemeDialogProps {
  open: boolean;
  theme: ResearchTheme | null;
  professors: ProfessorItem[];
  isSecretaryOrCoordinator: boolean;
  onClose: () => void;
  onSubmit: (formData: ResearchThemeFormData) => void;
}

export function ResearchThemeDialog({
  open,
  theme,
  professors,
  isSecretaryOrCoordinator,
  onClose,
  onSubmit,
}: ResearchThemeDialogProps) {
  // Key for remounting when theme/open changes, resetting form defaults
  const componentKey = React.useMemo(() => {
    if (!open) return 'closed';
    return theme ? `edit-${theme.id}` : 'create';
  }, [open, theme]);

  const defaultValues = React.useMemo<ResearchThemeFormData>(() => {
    if (theme) {
      return {
        title: theme.title,
        description: theme.description,
        vacancies: theme.vacancies,
        level: theme.level,
        references: theme.references,
        associatedProfessorIds: theme.associatedProfessors?.map(p => p.id) ?? [],
        professorId: theme.professorId,
      };
    }
    return INITIAL_RESEARCH_THEME_FORM;
  }, [theme]);

  const form = useForm({
    defaultValues,
    validators: { onSubmit: researchThemeFormSchema },
    onSubmit: async ({ value }) => {
      // Validate professorId if secretary/coordinator
      if (isSecretaryOrCoordinator && !theme && !value.professorId) {
        toast.error('Selecione o professor proprietário do tema.');
        return;
      }
      onSubmit(value);
      form.reset();
      onClose();
    },
  });

  // Local state for adding a reference link
  const [refName, setRefName] = React.useState('');
  const [refUrl, setRefUrl] = React.useState('');
  const [refError, setRefError] = React.useState('');

  // Local search state for associated professors
  const [profSearch, setProfSearch] = React.useState('');

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent key={componentKey} className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-3xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="font-serif text-xl font-bold text-slate-900">
            {theme ? 'Editar Tema de Pesquisa' : 'Cadastrar Tema de Pesquisa'}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-slate-500">
            Preencha as informações do tema de pesquisa, as vagas disponíveis, referências de
            leitura e professores colaboradores associados.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          id="research-theme-form"
          onSubmit={event => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          {/* Professor Owner field - visible only to secretary/coordinator during creation */}
          {isSecretaryOrCoordinator && !theme && (
            <form.Field
              name="professorId"
              children={field => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const fieldErrors = toFieldErrors(field.state.meta.errors);

                return (
                  <Field data-invalid={isInvalid} className="space-y-1">
                    <FieldLabel htmlFor={field.name}>
                      Professor Orientador (Proprietário)
                    </FieldLabel>
                    <Select
                      value={field.state.value || ''}
                      onValueChange={value => field.handleChange(value)}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue placeholder="Selecione o professor orientador" />
                      </SelectTrigger>
                      <SelectContent>
                        {professors.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.institution})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={fieldErrors} />
                  </Field>
                );
              }}
            />
          )}

          <form.Field
            name="title"
            children={field => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const fieldErrors = toFieldErrors(field.state.meta.errors);

              return (
                <Field data-invalid={isInvalid} className="space-y-1">
                  <FieldLabel htmlFor={field.name}>Título do Tema</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                      placeholder="Ex.: Aprendizado de Máquina aplicado a Diagnósticos de Saúde"
                      aria-invalid={isInvalid}
                    />
                    <FieldError errors={fieldErrors} />
                  </FieldContent>
                </Field>
              );
            }}
          />

          <form.Field
            name="description"
            children={field => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const fieldErrors = toFieldErrors(field.state.meta.errors);

              return (
                <Field data-invalid={isInvalid} className="space-y-1">
                  <FieldLabel htmlFor={field.name}>Descrição / Resumo do Tema</FieldLabel>
                  <FieldContent>
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                      rows={5}
                      className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Descreva os objetivos da pesquisa, pré-requisitos desejados e metodologia esperada."
                      aria-invalid={isInvalid}
                    />
                    <FieldError errors={fieldErrors} />
                  </FieldContent>
                </Field>
              );
            }}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field
              name="level"
              children={field => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const fieldErrors = toFieldErrors(field.state.meta.errors);

                return (
                  <Field data-invalid={isInvalid} className="space-y-1">
                    <FieldLabel htmlFor={field.name}>Nível</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={value => field.handleChange(value as 'masters' | 'doctoral')}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masters">Mestrado (Masters)</SelectItem>
                        <SelectItem value="doctoral">Doutorado (Doctoral)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={fieldErrors} />
                  </Field>
                );
              }}
            />

            <form.Field
              name="vacancies"
              children={field => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const fieldErrors = toFieldErrors(field.state.meta.errors);

                return (
                  <Field data-invalid={isInvalid} className="space-y-1">
                    <FieldLabel htmlFor={field.name}>Número de Vagas</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min={1}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={event => field.handleChange(Number(event.target.value))}
                        aria-invalid={isInvalid}
                      />
                      <FieldError errors={fieldErrors} />
                    </FieldContent>
                  </Field>
                );
              }}
            />
          </div>

          {/* References Section */}
          <form.Field
            name="references"
            children={field => {
              const currentRefs = field.state.value || [];
              const fieldErrors = toFieldErrors(field.state.meta.errors);

              const handleAddReference = () => {
                if (!refName.trim()) {
                  setRefError('Informe o nome da referência.');
                  return;
                }
                if (!refUrl.trim()) {
                  setRefError('Informe a URL da referência.');
                  return;
                }
                try {
                  new URL(refUrl);
                } catch {
                  setRefError('A URL informada é inválida.');
                  return;
                }

                const newRef: ResearchThemeReference = { name: refName.trim(), url: refUrl.trim() };
                field.handleChange([...currentRefs, newRef]);
                setRefName('');
                setRefUrl('');
                setRefError('');
              };

              const handleRemoveReference = (index: number) => {
                field.handleChange(currentRefs.filter((_, i) => i !== index));
              };

              return (
                <Field className="space-y-2">
                  <FieldLabel>Referências / Leituras Recomendadas</FieldLabel>
                  <div className="space-y-2">
                    {currentRefs.length > 0 ? (
                      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/50 p-2">
                        {currentRefs.map((ref, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-1.5 px-2 text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800">{ref.name}</span>
                              <a
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {ref.url}
                              </a>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleRemoveReference(i)}
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Nenhuma referência cadastrada.</p>
                    )}

                    <div className="grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-5">
                      <div className="sm:col-span-2">
                        <Input
                          placeholder="Nome (ex: Artigo Principal)"
                          value={refName}
                          onChange={e => setRefName(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          placeholder="Link (ex: https://...)"
                          value={refUrl}
                          onChange={e => setRefUrl(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full h-9 text-xs font-semibold"
                          onClick={handleAddReference}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                    {refError && <p className="text-xs text-red-600 font-semibold">{refError}</p>}
                    <FieldError errors={fieldErrors} />
                  </div>
                </Field>
              );
            }}
          />

          {/* Associated Professors Section */}
          <form.Field
            name="associatedProfessorIds"
            children={field => {
              const selectedIds = field.state.value || [];
              const fieldErrors = toFieldErrors(field.state.meta.errors);

              // Filter out the theme owner from the selectable list
              const ownerId = theme ? theme.professorId : form.getFieldValue('professorId');
              const eligibleProfessors = professors.filter(p => p.id !== ownerId);

              const filteredProfs = eligibleProfessors.filter(
                p =>
                  p.name.toLowerCase().includes(profSearch.toLowerCase()) ||
                  p.institution.toLowerCase().includes(profSearch.toLowerCase()),
              );

              const toggleProfessor = (id: string) => {
                if (selectedIds.includes(id)) {
                  field.handleChange(selectedIds.filter(val => val !== id));
                } else {
                  field.handleChange([...selectedIds, id]);
                }
              };

              return (
                <Field className="space-y-2">
                  <FieldLabel>Professores Colaboradores (Coorientadores)</FieldLabel>
                  <div className="space-y-3">
                    <Input
                      placeholder="Buscar por nome ou instituição para associar..."
                      value={profSearch}
                      onChange={e => setProfSearch(e.target.value)}
                      className="h-9 text-xs"
                    />

                    {selectedIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedIds.map(id => {
                          const prof = professors.find(p => p.id === id);
                          if (!prof) return null;
                          return (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="flex items-center gap-1.5 py-1 text-xs"
                            >
                              <span>
                                {prof.name} ({prof.institution})
                              </span>
                              <button
                                type="button"
                                className="text-slate-400 hover:text-slate-600 font-bold"
                                onClick={() => toggleProfessor(id)}
                              >
                                &times;
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 divide-y divide-slate-100">
                      {filteredProfs.length > 0 ? (
                        filteredProfs.map(p => {
                          const isSelected = selectedIds.includes(p.id);
                          return (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => toggleProfessor(p.id)}
                              className={`flex w-full items-center justify-between py-2 px-3 text-left text-xs transition-colors hover:bg-slate-50 ${
                                isSelected
                                  ? 'bg-slate-50 font-semibold text-blue-600'
                                  : 'text-slate-700'
                              }`}
                            >
                              <div>
                                <p className="font-semibold">{p.name}</p>
                                <p className="text-slate-400 text-[10px]">
                                  {p.institution} - {p.department}
                                </p>
                              </div>
                              {isSelected && <span className="text-blue-600">✓</span>}
                            </button>
                          );
                        })
                      ) : (
                        <p className="p-3 text-center text-xs text-slate-400">
                          Nenhum professor encontrado.
                        </p>
                      )}
                    </div>
                    <FieldError errors={fieldErrors} />
                  </div>
                </Field>
              );
            }}
          />

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 font-medium text-slate-600 hover:bg-slate-50"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="research-theme-form"
              className="bg-blue-600 font-medium text-white hover:bg-blue-700"
            >
              Salvar Tema
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
