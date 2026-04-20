export function normalizeCpf(value: unknown): unknown {
  return typeof value === 'string' ? value.replace(/\D/g, '').trim() : value;
}
