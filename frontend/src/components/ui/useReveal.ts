import { useEffect, useRef, useState } from 'react'

interface UseRevealOptions {
  /** Fraction of the element that must be visible before revealing. 0–1. */
  threshold?: number
  /** Reveal once and stop observing. Defaults to true. */
  once?: boolean
}

/**
 * Reveal-on-scroll: returns a ref + a flag that becomes `true` once the target
 * intersects the viewport. Falls back to "always revealed" when
 * IntersectionObserver is unavailable (older browsers, jsdom).
 */
export function useReveal<T extends HTMLElement = HTMLElement>(
  options: UseRevealOptions = {},
): { ref: React.RefObject<T | null>; revealed: boolean } {
  const { threshold = 0.15, once = true } = options
  const ref = useRef<T | null>(null)
  const [revealed, setRevealed] = useState<boolean>(typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true)
            if (once) observer.disconnect()
          } else if (!once) {
            setRevealed(false)
          }
        }
      },
      { threshold },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [threshold, once])

  return { ref, revealed }
}
