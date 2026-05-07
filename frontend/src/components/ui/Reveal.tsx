import type { HTMLAttributes, ReactNode } from 'react'
import { useReveal } from './useReveal'

interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Stagger delay applied to the transition, in milliseconds. */
  delayMs?: number
  threshold?: number
}

function Reveal({
  children,
  delayMs = 0,
  threshold = 0.15,
  className = '',
  style,
  ...rest
}: RevealProps) {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold })

  return (
    <div
      ref={ref}
      data-reveal=""
      data-revealed={revealed ? 'true' : 'false'}
      className={className}
      style={{ transitionDelay: `${String(delayMs)}ms`, ...style }}
      {...rest}
    >
      {children}
    </div>
  )
}

export default Reveal
