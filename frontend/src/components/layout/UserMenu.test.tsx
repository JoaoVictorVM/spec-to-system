import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContextHarness } from '../../auth/testing/AuthContextHarness'
import { makeAuthContextValue } from '../../auth/testing/makeAuthContextValue'
import UserMenu from './UserMenu'

function LocationProbe() {
  const location = useLocation()
  return <p data-testid="location">{location.pathname}</p>
}

describe('UserMenu', () => {
  it('renders the email and a logout button', () => {
    const value = makeAuthContextValue({
      status: 'authenticated',
      user: {
        id: 'u-1',
        email: 'user@example.com',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    })

    render(
      <MemoryRouter>
        <AuthContextHarness value={value}>
          <UserMenu email="user@example.com" />
        </AuthContextHarness>
      </MemoryRouter>,
    )

    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
  })

  it('calls logout and navigates back to / on click', async () => {
    const logout = vi.fn().mockResolvedValue(undefined)
    const value = makeAuthContextValue(
      {
        status: 'authenticated',
        user: {
          id: 'u-1',
          email: 'user@example.com',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      },
      { logout },
    )

    render(
      <MemoryRouter initialEntries={['/definition']}>
        <AuthContextHarness value={value}>
          <UserMenu email="user@example.com" />
          <Routes>
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </AuthContextHarness>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('location')).toHaveTextContent('/definition')

    act(() => {
      screen.getByRole('button', { name: /sair/i }).click()
    })

    expect(logout).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/')
    })
  })

  it('still navigates to / when logout fails (best-effort cleanup)', async () => {
    const logout = vi.fn().mockRejectedValue(new Error('network'))
    const value = makeAuthContextValue(
      {
        status: 'authenticated',
        user: {
          id: 'u-1',
          email: 'user@example.com',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      },
      { logout },
    )

    render(
      <MemoryRouter initialEntries={['/definition']}>
        <AuthContextHarness value={value}>
          <UserMenu email="user@example.com" />
          <Routes>
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </AuthContextHarness>
      </MemoryRouter>,
    )

    act(() => {
      screen.getByRole('button', { name: /sair/i }).click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/')
    })
  })
})
