import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { findProvider } from '../../../ai'
import ProviderAvatar from './ProviderAvatar'

describe('ProviderAvatar', () => {
  it('renders the provider initial as decorative content', () => {
    const provider = findProvider('openai')
    render(<ProviderAvatar provider={provider} />)
    const span = screen.getByText('O')
    expect(span).toHaveAttribute('aria-hidden', 'true')
  })

  it('uses the brand color variable as the background', () => {
    const provider = findProvider('anthropic')
    render(<ProviderAvatar provider={provider} />)
    const span = screen.getByText('A')
    expect(span).toHaveStyle({ backgroundColor: 'var(--color-pink)' })
  })
})
