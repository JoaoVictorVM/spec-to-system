import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, type PublicUser } from '../../api'
import type { AuthContextValue } from '../../auth/AuthContext'
import { AuthContextHarness } from '../../auth/testing/AuthContextHarness'
import { makeAuthContextValue } from '../../auth/testing/makeAuthContextValue'
import RegisterPage from './RegisterPage'

const fakeUser: PublicUser = {
  id: 'u-1',
  email: 'a@b.c',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

type LoginFn = AuthContextValue['login']
type RegisterFn = AuthContextValue['register']

interface LocationProbeState {
  registeredEmail?: string
}

function LocationProbe() {
  const location = useLocation()
  const state = location.state as LocationProbeState | null
  return (
    <p data-testid="location">
      {location.pathname}|registered={state?.registeredEmail ?? 'none'}
    </p>
  )
}

interface RenderOptions {
  register?: RegisterFn
  login?: LoginFn
}

function renderRegister(opts: RenderOptions = {}) {
  const register: RegisterFn = opts.register ?? vi.fn<RegisterFn>().mockResolvedValue(fakeUser)
  const login: LoginFn = opts.login ?? vi.fn<LoginFn>().mockResolvedValue(fakeUser)
  const value = makeAuthContextValue({ status: 'unauthenticated' }, { register, login })
  return {
    register,
    login,
    ...render(
      <MemoryRouter initialEntries={['/register']}>
        <AuthContextHarness value={value}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </AuthContextHarness>
      </MemoryRouter>,
    ),
  }
}

function fillValidFormAndSubmit() {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'secret123' } })
  fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }))
}

describe('RegisterPage', () => {
  it('renders the form heading and the password hint', () => {
    renderRegister()
    expect(screen.getByRole('heading', { level: 1, name: /cadastrar/i })).toBeInTheDocument()
    expect(screen.getByText(/pelo menos 8 caracteres/i)).toBeInTheDocument()
  })

  it('rejects short passwords client-side without calling the API', () => {
    const { register } = renderRegister()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.c' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'abc1' } })
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/8 caracteres/i)
    expect(register).not.toHaveBeenCalled()
  })

  it('rejects passwords without a digit client-side', () => {
    const { register } = renderRegister()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.c' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'abcdefgh' } })
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/número/i)
    expect(register).not.toHaveBeenCalled()
  })

  it('calls register() then login() then navigates to /definition on success', async () => {
    const { register, login } = renderRegister()
    fillValidFormAndSubmit()

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith('new@example.com', 'secret123')
    })
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('new@example.com', 'secret123')
    })
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toContain('/definition')
    })
  })

  it('shows "email já cadastrado" on 409', async () => {
    const register = vi.fn<RegisterFn>().mockRejectedValue(new ApiError(409, 'Conflict', null))
    const { login } = renderRegister({ register })
    fillValidFormAndSubmit()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/já está cadastrado/i)
    })
    expect(login).not.toHaveBeenCalled()
  })

  it('falls back to /login (with email pre-fill) when auto-login fails', async () => {
    const login = vi.fn<LoginFn>().mockRejectedValue(new ApiError(500, 'Internal', null))
    renderRegister({ login })
    fillValidFormAndSubmit()

    await waitFor(() => {
      const text = screen.getByTestId('location').textContent ?? ''
      expect(text).toContain('/login')
      expect(text).toContain('registered=new@example.com')
    })
  })

  it('exposes a link to /login in the footer', () => {
    renderRegister()
    expect(screen.getByRole('link', { name: /entrar/i })).toHaveAttribute('href', '/login')
  })
})
