import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, type Specification } from '../../../api'
import { specificationsApi } from '../../../api/specifications'
import { AuthContextHarness } from '../../../auth/testing/AuthContextHarness'
import { makeAuthContextValue } from '../../../auth/testing/makeAuthContextValue'
import HistoryPanel from './HistoryPanel'

function makeSpec(seed: string): Specification {
  return {
    id: `id-${seed}`,
    sessionCode: seed,
    prompt: `prompt for ${seed}`,
    response: 'r',
    userId: 'u-1',
    createdAt: '2026-01-15T14:30:00Z',
  }
}

function renderPanel(state: Parameters<typeof makeAuthContextValue>[0]) {
  return render(
    <MemoryRouter>
      <AuthContextHarness value={makeAuthContextValue(state)}>
        <HistoryPanel />
      </AuthContextHarness>
    </MemoryRouter>,
  )
}

describe('HistoryPanel', () => {
  beforeEach(() => {
    vi.spyOn(specificationsApi, 'list').mockResolvedValue({
      items: [makeSpec('aaaaaa'), makeSpec('bbbbbb')],
      nextCursor: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exposes a labeled region with the heading "Histórico"', () => {
    renderPanel({ status: 'unauthenticated' })
    expect(screen.getByRole('region', { name: /histórico de especificações/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /histórico/i })).toBeInTheDocument()
  })

  it('shows the login CTA when unauthenticated', () => {
    const listSpy = vi.spyOn(specificationsApi, 'list')
    renderPanel({ status: 'unauthenticated' })
    expect(screen.getByText(/salvar e rever/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login')
    expect(listSpy).not.toHaveBeenCalled()
  })

  it('renders a session loading hint while auth is hydrating', () => {
    const listSpy = vi.spyOn(specificationsApi, 'list')
    renderPanel({ status: 'loading' })
    expect(screen.getByText(/carregando sessão/i)).toBeInTheDocument()
    expect(listSpy).not.toHaveBeenCalled()
  })

  it('fetches and lists items when authenticated', async () => {
    renderPanel({
      status: 'authenticated',
      user: { id: 'u-1', email: 'a@b.c', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    })

    await waitFor(() => {
      expect(screen.getByRole('list', { name: /especificações anteriores/i })).toBeInTheDocument()
    })
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('shows an error message when the list call fails', async () => {
    vi.spyOn(specificationsApi, 'list').mockRejectedValue(new ApiError(500, 'Internal', null))

    renderPanel({
      status: 'authenticated',
      user: { id: 'u-1', email: 'a@b.c', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    })

    await waitFor(() => {
      expect(screen.getByText(/não foi possível carregar o histórico/i)).toBeInTheDocument()
    })
  })
})
