import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Header from './Header'

describe('Header', () => {
  it('renders inside a banner landmark', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    )
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('shows the brand and the auth actions side-by-side', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /spec-to-system/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /entrar/i })).toBeInTheDocument()
  })
})
