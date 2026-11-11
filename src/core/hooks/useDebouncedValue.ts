import { useEffect, useState } from 'react';

/**
 * Debounces rapidly changing values (such as search inputs) before dispatching
 * backend paginated queries.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
