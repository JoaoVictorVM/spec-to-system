import { useEffect, useState } from 'react'

/**
 * Returns a value that lags behind the input by `delayMs`. The latest input
 * wins — pending updates are cancelled if the input changes again before the
 * timeout fires.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value)
    }, delayMs)
    return () => {
      clearTimeout(timeout)
    }
  }, [value, delayMs])

  return debounced
}
