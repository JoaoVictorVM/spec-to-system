import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import HeaderActions from './HeaderActions'

describe('HeaderActions', () => {
  it('renders a login link pointing to /login', () => {
    render(
      <MemoryRouter>
        <HeaderActions />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: /entrar/i })
    expect(link).toHaveAttribute('href', '/login')
  })

  it('exposes an accessible navigation landmark', () => {
    render(
      <MemoryRouter>
        <HeaderActions />
      </MemoryRouter>,
    )
    expect(screen.getByRole('navigation', { name: /account/i })).toBeInTheDocument()
  })
})
