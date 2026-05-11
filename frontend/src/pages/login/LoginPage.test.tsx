import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, type PublicUser } from '../../api'
import type { AuthContextValue } from '../../auth/AuthContext'
import { AuthContextHarness } from '../../auth/testing/AuthContextHarness'
import { makeAuthContextValue } from '../../auth/testing/makeAuthContextValue'
import LoginPage from './LoginPage'

const fakeUser: PublicUser = {
  id: 'u-1',
  email: 'a@b.c',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

type LoginFn = AuthContextValue['login']

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

interface RenderOptions {
  login?: LoginFn
  initialPath?: string
  initialState?: { from?: string; registeredEmail?: string } | null
}

function renderLogin(opts: RenderOptions = {}) {
  const login: LoginFn = opts.login ?? vi.fn<LoginFn>().mockResolvedValue(fakeUser)
  const value = makeAuthContextValue({ status: 'unauthenticated' }, { login })
  return {
    login,
    ...render(
      <MemoryRouter
        initialEntries={[
          { pathname: opts.initialPath ?? '/login', state: opts.initialState ?? null },
        ]}
      >
        <AuthContextHarness value={value}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </AuthContextHarness>
      </MemoryRouter>,
    ),
  }
}

describe('LoginPage', () => {
  it('renders the form with email + password fields', () => {
    renderLogin()
    expect(screen.getByRole('heading', { level: 1, name: /entrar/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('disables submit until both fields are filled', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.c' } })
    expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'pw' } })
    expect(screen.getByRole('button', { name: /entrar/i })).toBeEnabled()
  })

  it('calls login() with the typed credentials on submit', async () => {
    const { login } = renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: '  user@example.com  ' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('user@example.com', 'secret123')
    })
  })

  it('redirects to /definition on successful login', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.c' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'pw' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toContain('/definition')
    })
  })

  it('redirects to location.state.from when provided (post-PrivateRoute flow)', async () => {
    renderLogin({ initialState: { from: '/users/me' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.c' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'pw' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toContain('/users/me')
    })
  })

  it('shows the credentials error on 401 and re-enables the form', async () => {
    const login = vi.fn<LoginFn>().mockRejectedValue(new ApiError(401, 'Unauthorized', null))
    renderLogin({ login })

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.c' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'pw' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/incorretos/i)
    })
    expect(screen.getByRole('button', { name: /entrar/i })).toBeEnabled()
  })

  it('pre-fills email from location.state.registeredEmail (post-register fallback)', () => {
    renderLogin({ initialState: { registeredEmail: 'newuser@example.com' } })
    expect(screen.getByLabelText<HTMLInputElement>(/email/i).value).toBe('newuser@example.com')
  })

  it('exposes a link to /register in the footer', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /cadastrar/i })).toHaveAttribute('href', '/register')
  })
})
