import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Loader2, Plus, Search } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useCreateUniversity, useUniversitySearch } from '../hooks/use-universities';

interface UniversityComboboxProps {
  selectedId: string | null;
  selectedLabel: string | null;
  onSelect: (id: string | null, label: string | null) => void;
  error?: string;
}

export function UniversityCombobox({
  selectedId,
  selectedLabel,
  onSelect,
  error,
}: UniversityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { query, setQuery, results, isLoading } = useUniversitySearch('');

  // Create University form state
  const createUni = useCreateUniversity();
  const [newName, setNewName] = useState('');
  const [newAbbrev, setNewAbbrev] = useState('');
  const [newState, setNewState] = useState('');
  const [newCity, setNewCity] = useState('');

  const handleCreateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('O nome da universidade é obrigatório.');
      return;
    }
    try {
      const newUni = await createUni.mutateAsync({
        name: newName.trim(),
        abbreviation: newAbbrev.trim() || undefined,
        state: newState.trim() || undefined,
        city: newCity.trim() || undefined,
      });
      const label = newUni.abbreviation ? `${newUni.name} (${newUni.abbreviation})` : newUni.name;
      onSelect(newUni.id, label);
      toast.success('Universidade cadastrada com sucesso.');
      setModalOpen(false);
      setOpen(false);
      // Reset form
      setNewName('');
      setNewAbbrev('');
      setNewState('');
      setNewCity('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar universidade.');
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between rounded-2xl bg-white border border-input px-4 py-3 h-auto font-normal text-sm focus:ring-2 focus:ring-primary focus:outline-none',
              error && 'border-destructive focus:ring-destructive',
              !selectedId && 'text-muted-foreground',
            )}
          >
            <span className="truncate">
              {selectedId ? selectedLabel : 'Selecione a universidade...'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 rounded-2xl border bg-white shadow-lg overflow-hidden z-50">
          <div className="flex items-center border-b px-3 bg-muted/20">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Digite pelo menos 2 letras..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1 space-y-1">
            {isLoading && (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Buscando...
              </div>
            )}
            {!isLoading && results.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {query.length < 2
                  ? 'Digite 2 ou mais caracteres para buscar'
                  : 'Nenhuma universidade encontrada'}
              </div>
            )}
            {!isLoading &&
              results.map(uni => (
                <button
                  key={uni.id}
                  type="button"
                  onClick={() => {
                    onSelect(uni.id, uni.label);
                    setOpen(false);
                  }}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-xl px-3 py-2 text-sm outline-none hover:bg-muted/50 text-left transition-colors',
                    selectedId === uni.id && 'bg-primary/5 text-primary font-medium',
                  )}
                >
                  <span className="truncate flex-1">{uni.label}</span>
                  {selectedId === uni.id && (
                    <Check className="h-4 w-4 text-primary ml-2 shrink-0" />
                  )}
                </button>
              ))}
          </div>
          <div className="border-t p-2 bg-muted/5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="w-full justify-start rounded-xl gap-2 font-medium text-xs text-primary hover:text-primary hover:bg-primary/5"
            >
              <Plus className="h-4 w-4" />
              Cadastrar nova universidade
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl z-50">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-semibold">
              Cadastrar Universidade
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUniversity} className="space-y-4 pt-2">
            <Field className="space-y-1.5">
              <FieldLabel htmlFor="uni-name">Nome da Universidade *</FieldLabel>
              <FieldContent>
                <Input
                  id="uni-name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ex.: Universidade Federal do Ceará"
                  required
                />
              </FieldContent>
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field className="space-y-1.5 col-span-1">
                <FieldLabel htmlFor="uni-abbrev">Sigla</FieldLabel>
                <FieldContent>
                  <Input
                    id="uni-abbrev"
                    value={newAbbrev}
                    onChange={e => setNewAbbrev(e.target.value)}
                    placeholder="Ex.: UFC"
                  />
                </FieldContent>
              </Field>

              <Field className="space-y-1.5 col-span-1">
                <FieldLabel htmlFor="uni-state">Estado (UF)</FieldLabel>
                <FieldContent>
                  <Input
                    id="uni-state"
                    value={newState}
                    onChange={e => setNewState(e.target.value.toUpperCase())}
                    placeholder="Ex.: CE"
                    maxLength={2}
                  />
                </FieldContent>
              </Field>

              <Field className="space-y-1.5 col-span-1">
                <FieldLabel htmlFor="uni-city">Cidade</FieldLabel>
                <FieldContent>
                  <Input
                    id="uni-city"
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    placeholder="Ex.: Fortaleza"
                  />
                </FieldContent>
              </Field>
            </div>

            <DialogFooter className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createUni.isPending} className="rounded-xl min-w-24">
                {createUni.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
