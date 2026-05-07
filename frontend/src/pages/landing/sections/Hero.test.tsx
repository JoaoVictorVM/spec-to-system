import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Hero from './Hero'

function renderHero() {
  return render(
    <MemoryRouter>
      <Hero />
    </MemoryRouter>,
  )
}

describe('Hero', () => {
  it('renders the headline as an h1', () => {
    renderHero()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('shows the subtitle copy', () => {
    renderHero()
    expect(screen.getByText(/sua própria chave de api/i)).toBeInTheDocument()
  })

  it('links the primary CTA to /definition', () => {
    renderHero()
    expect(screen.getByRole('link', { name: /começar agora/i })).toHaveAttribute(
      'href',
      '/definition',
    )
  })

  it('exposes a secondary "Como funciona" link to the in-page anchor', () => {
    renderHero()
    expect(screen.getByRole('link', { name: /como funciona/i })).toHaveAttribute(
      'href',
      '/#how-it-works',
    )
  })
})
