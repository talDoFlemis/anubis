export function getUserInitials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.charAt(0)?.toUpperCase() ?? '';
  const last = lastName?.charAt(0)?.toUpperCase() ?? '';

  return first + last || '?';
}

export function getUserDisplayName(
  firstName: string | null,
  lastName: string | null,
  fallbackLabel = 'Usuário',
): string {
  return [firstName, lastName].filter(Boolean).join(' ') || fallbackLabel;
}
