import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api'
import { specificationsApi } from '../../api/specifications'
import AiSessionProvider from '../../ai/AiSessionProvider'
import { AuthContextHarness } from '../../auth/testing/AuthContextHarness'
import { makeAuthContextValue } from '../../auth/testing/makeAuthContextValue'
import DefinitionPage from './DefinitionPage'

function renderPage(
  authStatus: 'loading' | 'authenticated' | 'unauthenticated' = 'unauthenticated',
) {
  const authValue =
    authStatus === 'authenticated'
      ? makeAuthContextValue({
          status: 'authenticated',
          user: { id: 'u-1', email: 'a@b.c', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        })
      : authStatus === 'loading'
        ? makeAuthContextValue({ status: 'loading' })
        : makeAuthContextValue({ status: 'unauthenticated' })

  return render(
    <MemoryRouter>
      <AuthContextHarness value={authValue}>
        <AiSessionProvider>
          <DefinitionPage />
        </AiSessionProvider>
      </AuthContextHarness>
    </MemoryRouter>,
  )
}

describe('DefinitionPage', () => {
  beforeEach(() => {
    vi.spyOn(specificationsApi, 'list').mockResolvedValue({ items: [], nextCursor: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the page heading', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { level: 1, name: /nova especificação/i }),
    ).toBeInTheDocument()
  })

  it('shows the configuration region (provider + api key)', () => {
    renderPage()
    expect(screen.getByRole('region', { name: /configuração de ia/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/provedor de ia/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/chave de api/i)).toBeInTheDocument()
  })

  it('shows the prompt form with disabled submit while incomplete', () => {
    renderPage()
    expect(screen.getByRole('form', { name: /geração de especificação/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /gerar especificação/i })).toBeDisabled()
  })

  it('shows the history panel with the login CTA when unauthenticated', () => {
    renderPage('unauthenticated')
    expect(screen.getByRole('region', { name: /histórico de especificações/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login')
  })

  it('fetches the history when authenticated', async () => {
    const listSpy = vi.spyOn(specificationsApi, 'list')
    renderPage('authenticated')
    await waitFor(() => {
      expect(listSpy).toHaveBeenCalled()
    })
  })

  it('still renders the page when the history fetch fails (does not crash)', async () => {
    vi.spyOn(specificationsApi, 'list').mockRejectedValue(new ApiError(500, 'Internal', null))
    renderPage('authenticated')
    await waitFor(() => {
      expect(screen.getByText(/não foi possível carregar o histórico/i)).toBeInTheDocument()
    })
    // Page itself still works.
    expect(
      screen.getByRole('heading', { level: 1, name: /nova especificação/i }),
    ).toBeInTheDocument()
  })
})
