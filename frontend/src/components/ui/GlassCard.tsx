import { type HTMLAttributes, type ReactNode, forwardRef } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Use the stronger glass variant for surfaces that sit higher in the stack. */
  variant?: 'default' | 'strong'
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { children, variant = 'default', className = '', ...rest },
  ref,
) {
  const surfaceClass = variant === 'strong' ? 'surface-glass-strong' : 'surface-glass'
  return (
    <div ref={ref} className={`${surfaceClass} rounded-xl ${className}`} {...rest}>
      {children}
    </div>
  )
})

export default GlassCard
