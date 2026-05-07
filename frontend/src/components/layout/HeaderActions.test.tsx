import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContextHarness } from '../../auth/testing/AuthContextHarness'
import { makeAuthContextValue } from '../../auth/testing/makeAuthContextValue'
import HeaderActions from './HeaderActions'

function renderWith(state: Parameters<typeof makeAuthContextValue>[0]) {
  return render(
    <MemoryRouter>
      <AuthContextHarness value={makeAuthContextValue(state)}>
        <HeaderActions />
      </AuthContextHarness>
    </MemoryRouter>,
  )
}

describe('HeaderActions', () => {
  it('exposes an accessible navigation landmark', () => {
    renderWith({ status: 'unauthenticated' })
    expect(screen.getByRole('navigation', { name: /account/i })).toBeInTheDocument()
  })

  it('shows a loading hint while the session is being hydrated', () => {
    renderWith({ status: 'loading' })
    expect(screen.getByText(/loading session/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /entrar/i })).toBeNull()
  })

  it('shows guest links when unauthenticated', () => {
    renderWith({ status: 'unauthenticated' })
    expect(screen.getByRole('link', { name: /entrar/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /cadastrar/i })).toBeInTheDocument()
  })

  it('shows the user email and a logout button when authenticated', () => {
    renderWith({
      status: 'authenticated',
      user: {
        id: 'u-1',
        email: 'user@example.com',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    })
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
  })
})
