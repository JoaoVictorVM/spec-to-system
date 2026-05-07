import type { AiProvider } from '../../../ai'

interface ProviderAvatarProps {
  provider: AiProvider
  size?: 'sm' | 'md'
}

const sizeClasses: Record<NonNullable<ProviderAvatarProps['size']>, string> = {
  sm: 'h-5 w-5 text-xs',
  md: 'h-6 w-6 text-sm',
}

function ProviderAvatar({ provider, size = 'md' }: ProviderAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-bg-deep ${sizeClasses[size]}`}
      style={{ backgroundColor: `var(--${provider.brandColorVar})` }}
    >
      {provider.initial}
    </span>
  )
}

export default ProviderAvatar
