function parseDateOnly(dateStr: string): Date | null {
  const [year, month, day] = dateStr.split('-').map(Number);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

/**
 * Format data to pt-BR with secure fallback.
 *  @example
 *  formatDatePtBr('2026-05-03').
 */
export function formatDatePtBr(value: string): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseDateOnly(value) : new Date(value);

  if (!date || Number.isNaN(date.getTime())) {
    return 'Data inválida';
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format number to pt-BR with local split
 * @example
 * // returns 1.200
 * formatNumberPtBr(1200).
 */
export function formatNumberPtBr(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}
