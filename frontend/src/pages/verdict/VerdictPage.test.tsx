import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as getAdapterModule from '../../ai/streaming/getAdapter'
import type { StreamAdapter, StreamRequest } from '../../ai/streaming/types'
import { AiSessionHarness } from '../../ai/testing/AiSessionHarness'
import { ApiError, type Specification } from '../../api'
import { specificationsApi } from '../../api/specifications'
import { AuthContextHarness } from '../../auth/testing/AuthContextHarness'
import { makeAuthContextValue } from '../../auth/testing/makeAuthContextValue'
import VerdictPage from './VerdictPage'

interface Controllable {
  adapter: StreamAdapter
  push: (chunk: string) => void
  end: () => void
  fail: (error: Error) => void
  started: Promise<{ request: StreamRequest }>
}

function makeControllableAdapter(): Controllable {
  const queue: string[] = []
  let endCalled = false
  let failure: Error | null = null
  let onPush: (() => void) | null = null
  let resolveStarted: ((value: { request: StreamRequest }) => void) | null = null
  const started = new Promise<{ request: StreamRequest }>((resolve) => {
    resolveStarted = resolve
  })

  const adapter: StreamAdapter = async function* (request) {
    resolveStarted?.({ request })
    while (true) {
      if (queue.length > 0) {
        yield queue.shift() as string
        continue
      }
      if (failure !== null) {
        const err: Error = failure
        failure = null
        throw err
      }
      if (endCalled) return
      await new Promise<void>((resolve) => {
        onPush = resolve
      })
    }
  }

  const flush = (): void => {
    onPush?.()
    onPush = null
  }
  return {
    adapter,
    started,
    push: (chunk) => {
      queue.push(chunk)
      flush()
    },
    end: () => {
      endCalled = true
      flush()
    },
    fail: (error) => {
      failure = error
      flush()
    },
  }
}

const persistedUser = {
  id: 'u-1',
  email: 'a@b.c',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

interface RenderOptions {
  initialPath?: string
  initialState?: { prompt: string } | null
  providerId?: 'openai' | 'anthropic' | 'gemini' | null
  apiKey?: string
  authStatus?: 'authenticated' | 'unauthenticated' | 'loading'
}

function renderVerdict(opts: RenderOptions = {}) {
  const {
    initialPath = '/verdict/aB3_-x',
    initialState = { prompt: 'um chat app' },
    providerId = 'openai',
    apiKey = 'sk-test',
    authStatus = 'unauthenticated',
  } = opts

  const authValue =
    authStatus === 'authenticated'
      ? makeAuthContextValue({ status: 'authenticated', user: persistedUser })
      : authStatus === 'loading'
        ? makeAuthContextValue({ status: 'loading' })
        : makeAuthContextValue({ status: 'unauthenticated' })

  return render(
    <MemoryRouter initialEntries={[{ pathname: initialPath, state: initialState }]}>
      <AuthContextHarness value={authValue}>
        <AiSessionHarness initialProviderId={providerId} initialApiKey={apiKey}>
          <Routes>
            <Route path="/verdict/:sessionCode" element={<VerdictPage />} />
            <Route path="/definition" element={<p>definition page</p>} />
          </Routes>
        </AiSessionHarness>
      </AuthContextHarness>
    </MemoryRouter>,
  )
}

describe('VerdictPage', () => {
  let controllable: Controllable

  beforeEach(() => {
    controllable = makeControllableAdapter()
    vi.spyOn(getAdapterModule, 'getAdapter').mockResolvedValue(controllable.adapter)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('streaming flow (state.prompt + creds)', () => {
    it('streams content and shows the cursor while in flight', async () => {
      renderVerdict()
      await controllable.started
      await act(async () => {
        controllable.push('## Visão Geral')
        await Promise.resolve()
      })
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: /visão geral/i })).toBeInTheDocument()
      })
      expect(screen.getByTestId('streaming-cursor')).toBeInTheDocument()
    })

    it('persists the spec via POST /specifications when authenticated', async () => {
      const createSpy = vi.spyOn(specificationsApi, 'create').mockResolvedValue({} as Specification)

      renderVerdict({ authStatus: 'authenticated' })
      await controllable.started
      await act(async () => {
        controllable.push('## Done')
        controllable.end()
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledTimes(1)
      })
      expect(createSpy).toHaveBeenCalledWith({
        sessionCode: 'aB3_-x',
        prompt: 'um chat app',
        response: '## Done',
      })
    })

    it('does NOT persist when unauthenticated', async () => {
      const createSpy = vi.spyOn(specificationsApi, 'create')

      renderVerdict({ authStatus: 'unauthenticated' })
      await controllable.started
      await act(async () => {
        controllable.push('## Done')
        controllable.end()
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(screen.queryByTestId('streaming-cursor')).toBeNull()
      })
      expect(createSpy).not.toHaveBeenCalled()
    })

    it('keeps the page rendered when persistence fails (best-effort)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      vi.spyOn(specificationsApi, 'create').mockRejectedValue(new ApiError(409, 'Conflict', null))

      renderVerdict({ authStatus: 'authenticated' })
      await controllable.started
      await act(async () => {
        controllable.push('## Done')
        controllable.end()
        await Promise.resolve()
      })

      await waitFor(() => {
        expect(warnSpy).toHaveBeenCalled()
      })
      expect(screen.getByRole('heading', { level: 1, name: 'aB3_-x' })).toBeInTheDocument()
    })
  })

  describe('revisit-by-URL (no state.prompt)', () => {
    it('fetches by sessionCode and renders the saved spec', async () => {
      vi.spyOn(specificationsApi, 'findByCode').mockResolvedValue({
        id: 'id-1',
        sessionCode: 'aB3_-x',
        prompt: 'meu app salvo',
        response: '## Visão Geral\n\nDetalhes salvos.',
        userId: 'u-1',
        createdAt: '2026-01-01T00:00:00Z',
      })

      renderVerdict({ initialState: null })

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: 'aB3_-x' })).toBeInTheDocument()
      })
      expect(screen.getByText('meu app salvo')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /visão geral/i })).toBeInTheDocument()
    })

    it('renders the 404 view when the sessionCode does not exist', async () => {
      vi.spyOn(specificationsApi, 'findByCode').mockRejectedValue(
        new ApiError(404, 'Not Found', { message: 'Specification not found' }),
      )

      renderVerdict({ initialState: null })

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /especificação não encontrada/i }),
        ).toBeInTheDocument()
      })
      expect(screen.getByText('aB3_-x')).toBeInTheDocument()
    })

    it('renders the 404 view when the fetch fails (transient errors)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      vi.spyOn(specificationsApi, 'findByCode').mockRejectedValue(
        new ApiError(500, 'Internal', null),
      )

      renderVerdict({ initialState: null })

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /especificação não encontrada/i }),
        ).toBeInTheDocument()
      })
      warnSpy.mockRestore()
    })
  })
})
