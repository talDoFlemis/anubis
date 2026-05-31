import { useCallback, useEffect, useRef, useState } from 'react';

import { Loader2, Search, X } from 'lucide-react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
  label: string;
  placeholder?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  options: Array<{ id: string; label: string }>;
  value: string | null;
  onChange: (id: string | null) => void;
  isLoading?: boolean;
  allowCustom?: boolean;
  onCustomSelect?: () => void;
  error?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  label,
  placeholder = 'Pesquisar...',
  searchQuery,
  onSearchChange,
  options,
  value,
  onChange,
  isLoading = false,
  allowCustom = false,
  onCustomSelect,
  error,
  disabled = false,
}: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = value ? options.find(o => o.id === value) : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
      if (!isOpen) {
        setIsOpen(true);
      }
    },
    [onSearchChange, isOpen],
  );

  const handleSelect = useCallback(
    (id: string) => {
      onChange(id);
      setIsOpen(false);
      onSearchChange('');
    },
    [onChange, onSearchChange],
  );

  const handleCustomSelect = useCallback(() => {
    setIsOpen(false);
    onSearchChange('');
    onCustomSelect?.();
  }, [onSearchChange, onCustomSelect]);

  const handleClear = useCallback(() => {
    onChange(null);
    onSearchChange('');
    inputRef.current?.focus();
  }, [onChange, onSearchChange]);

  return (
    <Field data-invalid={error ? true : undefined} data-disabled={disabled || undefined}>
      <FieldLabel>{label}</FieldLabel>

      <div ref={containerRef} className="relative">
        {/* Input area */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label={label}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            value={selectedOption && !isOpen ? '' : searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            disabled={disabled}
            className={cn(
              'pl-10 pr-10',
              selectedOption && !isOpen && 'text-foreground placeholder:text-foreground',
            )}
          />
          {/* Clear button or loading spinner */}
          {isLoading ? (
            <Loader2 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : selectedOption ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpar seleção"
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <ul
            role="listbox"
            aria-label={label}
            className="anubis-ghost-border anubis-card-shadow absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-[var(--surface-lowest)] py-1"
          >
            {options.length === 0 && !isLoading && !allowCustom && (
              <li className="px-4 py-3 text-center text-sm text-muted-foreground">
                Nenhum resultado encontrado
              </li>
            )}

            {options.map(option => (
              <li
                key={option.id}
                role="option"
                aria-selected={option.id === value}
                onClick={() => handleSelect(option.id)}
                className={cn(
                  'cursor-pointer px-4 py-2.5 text-sm transition-colors hover:bg-surface-low',
                  option.id === value && 'bg-primary/5 font-medium text-primary',
                )}
              >
                {option.label}
              </li>
            ))}

            {allowCustom && (
              <>
                {options.length > 0 && (
                  <li aria-hidden="true" className="mx-3 my-1 h-px bg-[var(--surface-high)]" />
                )}
                <li
                  role="option"
                  aria-selected={false}
                  onClick={handleCustomSelect}
                  className="cursor-pointer px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface-low"
                >
                  Outro (inserir manualmente)
                </li>
              </>
            )}

            {isLoading && (
              <li className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </li>
            )}
          </ul>
        )}
      </div>

      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
