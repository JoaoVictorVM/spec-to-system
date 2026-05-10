import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AiSessionProvider from '../ai/AiSessionProvider'
import { ApiError } from '../api'
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
    vi.spyOn(specificationsApi, 'findByCode').mockRejectedValue(
      new ApiError(404, 'Not Found', null),
    )
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

  it('renders the 404 view when /verdict/:sessionCode is opened without state and the spec does not exist', async () => {
    renderAt(buildVerdictPath('abc123'))
    // Without state.prompt, the page falls back to the public fetch which 404s.
    await screen.findByRole('heading', { level: 1, name: /especificação não encontrada/i })
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
