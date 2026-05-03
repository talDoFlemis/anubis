import formatFieldError from '@/shared/errors/formatFieldError';

/**
 * Map validation errors into FieldError-ready objects.
 * Usage: toFieldErrors(field.state.meta.errors)
 */
export function toFieldErrors(
  errors?: readonly unknown[],
): Array<{ message?: string } | undefined> {
  if (!errors?.length) return [];

  return errors
    .map(error => {
      const message = formatFieldError(error);
      if (!message) return undefined;
      return { message };
    })
    .filter(Boolean);
}
