import { useCallback, useRef, useState } from 'react';

import type { ChangeEvent, DragEvent } from 'react';

import { FileText, Upload, X } from 'lucide-react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

interface FileUploadFieldProps {
  label: string;
  accept?: string;
  maxSizeMb?: number;
  value: File | null;
  existingFileName?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadField({
  label,
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSizeMb = 10,
  value,
  existingFileName,
  onChange,
  error,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        onChange(null);
        setSizeError(null);
        return;
      }

      const maxBytes = maxSizeMb * 1024 * 1024;
      if (file.size > maxBytes) {
        setSizeError(`O arquivo excede o tamanho máximo de ${maxSizeMb} MB.`);
        return;
      }

      setSizeError(null);
      onChange(file);
    },
    [maxSizeMb, onChange],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      handleFile(file);
      // Reset the input so the same file can be re-selected
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0] ?? null;
      handleFile(file);
    },
    [handleFile],
  );

  const handleClear = useCallback(() => {
    onChange(null);
    setSizeError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onChange]);

  const displayedError = sizeError ?? error;
  const hasFile = value !== null;
  const hasExisting = !hasFile && !!existingFileName;

  return (
    <Field data-invalid={displayedError ? true : undefined}>
      <FieldLabel>{label}</FieldLabel>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="sr-only"
        aria-label={label}
      />

      {hasFile ? (
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-low)] px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{value.name}</span>
            <span className="text-xs text-muted-foreground">{formatFileSize(value.size)}</span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            aria-label="Remover arquivo"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : hasExisting ? (
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-low)] px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{existingFileName}</span>
            <span className="text-xs text-muted-foreground">Arquivo atual</span>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Substituir
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'anubis-ghost-border flex cursor-pointer flex-col items-center gap-3 rounded-2xl bg-[var(--surface-low)] px-6 py-8 transition-colors',
            'border-2 border-dashed border-[var(--outline-soft)]',
            isDragging && 'border-primary bg-primary/5',
            displayedError && 'border-destructive/40',
          )}
        >
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full bg-surface-high',
              isDragging && 'bg-primary/10',
            )}
          >
            <Upload className={cn('h-5 w-5 text-muted-foreground', isDragging && 'text-primary')} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Clique para selecionar ou arraste o arquivo
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')} • Máximo {maxSizeMb} MB
            </p>
          </div>
        </div>
      )}

      {displayedError && <FieldError>{displayedError}</FieldError>}
    </Field>
  );
}
