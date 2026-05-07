import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import PrivateRoute from './PrivateRoute'
import { AuthContextHarness } from './testing/AuthContextHarness'
import { makeAuthContextValue } from './testing/makeAuthContextValue'
import type { AuthState } from './state'

interface LocationProbeState {
  from?: string
}

function LocationProbe() {
  const location = useLocation()
  const state = location.state as LocationProbeState | null
  return (
    <p data-testid="location">
      {location.pathname}|from={state?.from ?? 'none'}
    </p>
  )
}

function ProtectedScreen() {
  return <p data-testid="protected">protected content</p>
}

function renderAt(state: AuthState, initialPath = '/definition') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthContextHarness value={makeAuthContextValue(state)}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/definition" element={<ProtectedScreen />} />
          </Route>
          <Route path="/login" element={<LocationProbe />} />
        </Routes>
      </AuthContextHarness>
    </MemoryRouter>,
  )
}

describe('PrivateRoute', () => {
  it('renders nothing visible while session is loading', () => {
    renderAt({ status: 'loading' })
    expect(screen.queryByTestId('protected')).toBeNull()
    expect(screen.queryByTestId('location')).toBeNull()
  })

  it('redirects to /login when unauthenticated, preserving the original path in state', () => {
    renderAt({ status: 'unauthenticated' })
    expect(screen.queryByTestId('protected')).toBeNull()
    expect(screen.getByTestId('location')).toHaveTextContent('/login|from=/definition')
  })

  it('renders the child route via Outlet when authenticated', () => {
    renderAt({
      status: 'authenticated',
      user: {
        id: 'u-1',
        email: 'a@b.c',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    })
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })
})
