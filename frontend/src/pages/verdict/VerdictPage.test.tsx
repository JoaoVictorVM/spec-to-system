import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as getAdapterModule from '../../ai/streaming/getAdapter'
import type { StreamAdapter, StreamRequest } from '../../ai/streaming/types'
import { StreamError } from '../../ai/streaming/types'
import { AiSessionHarness } from '../../ai/testing/AiSessionHarness'
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

interface RenderOptions {
  initialPath?: string
  initialState?: { prompt: string } | null
  providerId?: 'openai' | 'anthropic' | 'gemini' | null
  apiKey?: string
}

function renderVerdict(opts: RenderOptions = {}) {
  const {
    initialPath = '/verdict/aB3_-x',
    initialState = { prompt: 'um chat app' },
    providerId = 'openai',
    apiKey = 'sk-test',
  } = opts

  return render(
    <MemoryRouter initialEntries={[{ pathname: initialPath, state: initialState }]}>
      <AiSessionHarness initialProviderId={providerId} initialApiKey={apiKey}>
        <Routes>
          <Route path="/verdict/:sessionCode" element={<VerdictPage />} />
          <Route path="/definition" element={<p>definition page</p>} />
        </Routes>
      </AiSessionHarness>
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

  it('renders the session code header and the original prompt panel', async () => {
    renderVerdict()
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'aB3_-x' })).toBeInTheDocument()
    })
    expect(screen.getByRole('region', { name: /prompt original/i })).toBeInTheDocument()
    expect(screen.getByText('um chat app')).toBeInTheDocument()
  })

  it('streams the response into the markdown panel and shows the cursor while streaming', async () => {
    renderVerdict()

    await controllable.started
    await act(async () => {
      controllable.push('## Visão Geral\n\nUse Next.js.')
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /visão geral/i })).toBeInTheDocument()
    })
    expect(screen.getByTestId('streaming-cursor')).toBeInTheDocument()
  })

  it('removes the cursor and exposes the result region on completion', async () => {
    renderVerdict()
    await controllable.started
    await act(async () => {
      controllable.push('## Done')
      controllable.end()
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(screen.queryByTestId('streaming-cursor')).toBeNull()
    })
    const region = screen.getByRole('region', { name: /especificação gerada/i })
    expect(region.getAttribute('aria-busy')).toBe('false')
  })

  it('renders the error panel with a friendly message on invalid-key', async () => {
    renderVerdict()
    await controllable.started
    await act(async () => {
      controllable.fail(new StreamError('invalid-key', 'rejected'))
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(screen.getByText(/chave de api rejeitada/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /voltar ao formulário/i })).toHaveAttribute(
      'href',
      '/definition',
    )
  })

  it('redirects to /definition when there is no prompt in location state', () => {
    renderVerdict({ initialState: null })
    expect(screen.getByText('definition page')).toBeInTheDocument()
  })

  it('redirects to /definition when api key is missing', () => {
    renderVerdict({ apiKey: '' })
    expect(screen.getByText('definition page')).toBeInTheDocument()
  })
})
