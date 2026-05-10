import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AiSessionProvider from '../ai/AiSessionProvider'
import { specificationsApi } from '../api/specifications'
import { AuthContextHarness } from '../auth/testing/AuthContextHarness'
import { makeAuthContextValue } from '../auth/testing/makeAuthContextValue'
import AppRoutes from './AppRoutes'
import { buildVerdictPath } from './paths'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthContextHarness value={makeAuthContextValue({ status: 'unauthenticated' })}>
        <AiSessionProvider>
          <AppRoutes />
        </AiSessionProvider>
      </AuthContextHarness>
    </MemoryRouter>,
  )
}

describe('AppRoutes', () => {
  beforeEach(() => {
    vi.spyOn(specificationsApi, 'list').mockResolvedValue({ items: [], nextCursor: null })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders LandingPage at /', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/da ideia ao stack/i)
  })

  it('renders DefinitionPage at /definition', () => {
    renderAt('/definition')
    expect(
      screen.getByRole('heading', { level: 1, name: /nova especificação/i }),
    ).toBeInTheDocument()
  })

  it('redirects to /definition when /verdict/:sessionCode is opened without state', () => {
    renderAt(buildVerdictPath('abc123'))
    // Without state.prompt + AiSession credentials, the page bounces back.
    expect(
      screen.getByRole('heading', { level: 1, name: /nova especificação/i }),
    ).toBeInTheDocument()
  })

  it('renders LoginPage at /login', () => {
    renderAt('/login')
    expect(screen.getByRole('heading', { level: 1, name: /login/i })).toBeInTheDocument()
  })

  it('renders RegisterPage at /register', () => {
    renderAt('/register')
    expect(screen.getByRole('heading', { level: 1, name: /register/i })).toBeInTheDocument()
  })
})
