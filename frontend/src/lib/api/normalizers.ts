/** Coerce unknown to string, defaulting to `fallback` (empty string). */
export function asString(value: unknown, fallback = ''): string {
  return String(value ?? fallback);
}

/** Coerce unknown to nullable string. */
export function asNullableString(value: unknown): string | null {
  return (value as string | null | undefined) ?? null;
}

/** Coerce unknown to boolean. */
export function asBool(value: unknown): boolean {
  return Boolean(value);
}

/** Coerce unknown to nullable number. */
export function asNullableNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return value;
  }

  return value == null ? null : Number(value);
}

/**
 * Safely cast `data` to a plain record for field access.
 *
 * Usage: `const r = asRecord(data); return { id: asString(r.id) };`
 */
export function asRecord(data: unknown): Record<string, unknown> {
  return data as Record<string, unknown>;
}
