import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import GuestActions from './GuestActions'

describe('GuestActions', () => {
  it('renders login and register links pointing to the right routes', () => {
    render(
      <MemoryRouter>
        <GuestActions />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /entrar/i })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: /cadastrar/i })).toHaveAttribute('href', '/register')
  })
})
