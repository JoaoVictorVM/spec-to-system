import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type LinkButtonVariant = 'primary' | 'secondary' | 'ghost'
type LinkButtonSize = 'md' | 'lg'

interface LinkButtonProps extends Omit<LinkProps, 'children'> {
  children: ReactNode
  variant?: LinkButtonVariant
  size?: LinkButtonSize
}

const variantClasses: Record<LinkButtonVariant, string> = {
  primary: 'bg-accent text-text-primary shadow-glow-soft hover:bg-accent-hover hover:shadow-glow',
  secondary: 'surface-glass text-text-primary hover:border-border-bright',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-accent-soft',
}

const sizeClasses: Record<LinkButtonSize, string> = {
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

function LinkButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-base ease-out-quint focus-visible:outline focus-visible:outline-accent ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  )
}

export default LinkButton
