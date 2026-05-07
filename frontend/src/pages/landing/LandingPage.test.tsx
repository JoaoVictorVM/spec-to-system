import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LandingPage from './LandingPage'

describe('LandingPage', () => {
  it('renders all four sections (h1 + three h2s)', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    const h2s = screen.getAllByRole('heading', { level: 2 })
    expect(h2s.map((h) => h.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/três passos/i) as unknown as string,
        expect.stringMatching(/tudo que você precisa/i) as unknown as string,
        expect.stringMatching(/pronto para definir/i) as unknown as string,
      ]),
    )
  })

  it('shows two primary CTAs both pointing at /definition (hero + final)', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )
    const ctas = screen.getAllByRole('link', { name: /começar agora/i })
    expect(ctas).toHaveLength(2)
    for (const cta of ctas) {
      expect(cta).toHaveAttribute('href', '/definition')
    }
  })
})
