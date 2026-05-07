import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Reveal from './Reveal'

describe('Reveal', () => {
  it('renders children inside a data-reveal wrapper', () => {
    render(<Reveal>visible</Reveal>)
    expect(screen.getByText('visible')).toBeInTheDocument()
  })

  it('falls back to revealed when IntersectionObserver is unavailable (jsdom default)', () => {
    render(<Reveal data-testid="reveal">visible</Reveal>)
    // When IO is missing the hook seeds revealed=true, so the wrapper is set.
    expect(screen.getByTestId('reveal')).toHaveAttribute('data-revealed', 'true')
  })

  it('applies a transition delay style', () => {
    render(
      <Reveal delayMs={250} data-testid="reveal">
        x
      </Reveal>,
    )
    const wrapper = screen.getByTestId('reveal')
    expect(wrapper.style.transitionDelay).toBe('250ms')
  })
})
