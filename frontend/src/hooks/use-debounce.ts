import * as React from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delayMs`
 * milliseconds of silence.
 *
 * Usage: `const debouncedSearch = useDebounce(searchQuery, 400);`
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
