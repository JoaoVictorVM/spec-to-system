import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GlassCard from './GlassCard'

describe('GlassCard', () => {
  it('renders children', () => {
    render(<GlassCard>card body</GlassCard>)
    expect(screen.getByText('card body')).toBeInTheDocument()
  })

  it('uses the default surface class for the default variant', () => {
    render(<GlassCard data-testid="card">x</GlassCard>)
    const card = screen.getByTestId('card')
    expect(card.className).toContain('surface-glass')
    expect(card.className).not.toContain('surface-glass-strong')
  })

  it('uses the strong surface class for variant="strong"', () => {
    render(
      <GlassCard variant="strong" data-testid="card">
        x
      </GlassCard>,
    )
    expect(screen.getByTestId('card').className).toContain('surface-glass-strong')
  })

  it('forwards extra className', () => {
    render(
      <GlassCard className="custom" data-testid="card">
        x
      </GlassCard>,
    )
    expect(screen.getByTestId('card').className).toContain('custom')
  })
})
