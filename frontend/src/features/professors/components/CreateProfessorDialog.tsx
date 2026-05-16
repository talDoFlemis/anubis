import { useForm } from '@tanstack/react-form';
import * as React from 'react';

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
import { toFieldErrors } from '@/shared/errors/fieldErrors';
import {
  INITIAL_NEW_PROFESSOR_FORM,
  newProfessorFormSchema,
  type NewProfessorFormData,
} from '../types/professors-form.types';
import { normalizeCpf } from '../utils/professors-form.utils';

interface CreateProfessorDialogProps {
  open: boolean;
  linhasPesquisa: readonly string[];
  onClose: () => void;
  onSubmit: (formData: NewProfessorFormData) => void;
}

export function CreateProfessorDialog({
  open,
  linhasPesquisa,
  onClose,
  onSubmit,
}: CreateProfessorDialogProps) {
  const form = useForm({
    defaultValues: INITIAL_NEW_PROFESSOR_FORM,
    validators: { onSubmit: newProfessorFormSchema },
    onSubmit: async ({ value }) => {
      onSubmit(value);
      form.reset();
      onClose();
    },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [form, open]);

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="p-6 sm:max-w-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="font-serif text-xl font-bold text-slate-900">
            Cadastrar Novo Docente
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-slate-500">
            {
              'Preencha os dados para incluir o docente no sistema. O docente receberá um e-mail para ativar o acesso e criar sua senha.'
            }
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          id="create-professor-form"
          onSubmit={event => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="fullName"
            children={field => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const fieldErrors = toFieldErrors(field.state.meta.errors);

              return (
                <Field data-invalid={isInvalid} className="space-y-1">
                  <FieldLabel htmlFor={field.name}>Nome completo</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                      placeholder="Ex.: Maria da Silva"
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
              name="cpf"
              children={field => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const fieldErrors = toFieldErrors(field.state.meta.errors);

                return (
                  <Field data-invalid={isInvalid} className="space-y-1">
                    <FieldLabel htmlFor={field.name}>CPF</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        name={field.name}
                        inputMode="numeric"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={event =>
                          field.handleChange(normalizeCpf(event.target.value).slice(0, 11))
                        }
                        maxLength={11}
                        placeholder="Somente numeros"
                        aria-invalid={isInvalid}
                      />
                      <FieldError errors={fieldErrors} />
                    </FieldContent>
                  </Field>
                );
              }}
            />

            <form.Field
              name="professorId"
              children={field => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const fieldErrors = toFieldErrors(field.state.meta.errors);

                return (
                  <Field data-invalid={isInvalid} className="space-y-1">
                    <FieldLabel htmlFor={field.name}>Matricula do docente</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={event => field.handleChange(event.target.value)}
                        placeholder="Ex.: DOC-2026-001"
                        aria-invalid={isInvalid}
                      />
                      <FieldError errors={fieldErrors} />
                    </FieldContent>
                  </Field>
                );
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field
              name="email"
              children={field => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const fieldErrors = toFieldErrors(field.state.meta.errors);

                return (
                  <Field data-invalid={isInvalid} className="space-y-1">
                    <FieldLabel htmlFor={field.name}>E-mail</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={event => field.handleChange(event.target.value)}
                        placeholder="nome@instituicao.br"
                        aria-invalid={isInvalid}
                      />
                      <FieldError errors={fieldErrors} />
                    </FieldContent>
                  </Field>
                );
              }}
            />

            <form.Field
              name="originInstitution"
              children={field => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const fieldErrors = toFieldErrors(field.state.meta.errors);

                return (
                  <Field data-invalid={isInvalid} className="space-y-1">
                    <FieldLabel htmlFor={field.name}>Instituicao de origem</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={event => field.handleChange(event.target.value)}
                        placeholder="Ex.: UFC"
                        aria-invalid={isInvalid}
                      />
                      <FieldError errors={fieldErrors} />
                    </FieldContent>
                  </Field>
                );
              }}
            />
          </div>

          <form.Field
            name="mainResearchLine"
            children={field => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const fieldErrors = toFieldErrors(field.state.meta.errors);

              return (
                <Field data-invalid={isInvalid} className="space-y-1">
                  <FieldLabel htmlFor={field.name}>Linha de pesquisa principal</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={value => field.handleChange(value)}
                  >
                    <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                      <SelectValue placeholder="Selecione uma linha de pesquisa" />
                    </SelectTrigger>
                    <SelectContent>
                      {linhasPesquisa.map(linha => (
                        <SelectItem key={linha} value={linha}>
                          {linha}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={fieldErrors} />
                </Field>
              );
            }}
          />

          <DialogFooter className="gap-2 sm:gap-0">
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
              form="create-professor-form"
              className="bg-blue-600 font-medium text-white hover:bg-blue-700"
            >
              Salvar Cadastro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
