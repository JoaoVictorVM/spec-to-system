import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as getAdapterModule from './getAdapter'
import type { StreamAdapter, StreamRequest } from './types'
import { StreamError } from './types'
import { useStreaming, type StreamingStartRequest } from './useStreaming'

/**
 * Build a controllable adapter: caller pushes chunks via `push()` and ends
 * the stream via `end()` or `fail(error)`.
 */
interface Controllable {
  adapter: StreamAdapter
  push: (chunk: string) => void
  end: () => void
  fail: (error: Error) => void
  /** Resolves once the adapter generator starts iterating (i.e. start() ran). */
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
      // Wait for the next push/end/fail.
      await new Promise<void>((resolve) => {
        onPush = resolve
      })
    }
  }

  function flush(): void {
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

const baseRequest: StreamingStartRequest = {
  providerId: 'openai',
  apiKey: 'sk-test',
  model: 'gpt-4o',
  prompt: 'meu app',
}

describe('useStreaming', () => {
  let controllable: Controllable

  beforeEach(() => {
    controllable = makeControllableAdapter()
    vi.spyOn(getAdapterModule, 'getAdapter').mockResolvedValue(controllable.adapter)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in idle with empty content and no error', () => {
    const { result } = renderHook(() => useStreaming())
    expect(result.current.status).toBe('idle')
    expect(result.current.content).toBe('')
    expect(result.current.error).toBeNull()
  })

  it('transitions to streaming after start() and accumulates chunks', async () => {
    const { result } = renderHook(() => useStreaming())

    act(() => {
      result.current.start(baseRequest)
    })

    await waitFor(() => {
      expect(result.current.status).toBe('streaming')
    })

    await controllable.started
    await act(async () => {
      controllable.push('Hello ')
      await Promise.resolve()
      controllable.push('world')
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.content).toBe('Hello world')
    })
  })

  it('transitions to completed and fires onComplete with the full text', async () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useStreaming())

    act(() => {
      result.current.start({ ...baseRequest, onComplete })
    })

    await controllable.started
    await act(async () => {
      controllable.push('Hello ')
      controllable.push('world')
      controllable.end()
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('completed')
    })
    expect(onComplete).toHaveBeenCalledWith('Hello world')
  })

  it('forwards the start request to the adapter as apiKey/model/prompt + signal', async () => {
    const { result } = renderHook(() => useStreaming())

    act(() => {
      result.current.start(baseRequest)
    })

    const { request } = await controllable.started
    expect(request.apiKey).toBe('sk-test')
    expect(request.model).toBe('gpt-4o')
    expect(request.prompt).toBe('meu app')
    expect(request.signal).toBeInstanceOf(AbortSignal)
  })

  it('captures StreamError from the adapter into error state and calls onError', async () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useStreaming())

    act(() => {
      result.current.start({ ...baseRequest, onError })
    })

    await controllable.started
    await act(async () => {
      controllable.fail(new StreamError('invalid-key', 'rejected'))
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.error?.kind).toBe('invalid-key')
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('wraps unexpected errors into a generic StreamError("unknown")', async () => {
    const { result } = renderHook(() => useStreaming())

    act(() => {
      result.current.start(baseRequest)
    })

    await controllable.started
    await act(async () => {
      controllable.fail(new Error('boom'))
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.error?.kind).toBe('unknown')
  })

  it('abort() flips status to aborted and signals the adapter', async () => {
    const { result } = renderHook(() => useStreaming())

    act(() => {
      result.current.start(baseRequest)
    })

    const { request } = await controllable.started
    expect(request.signal?.aborted).toBe(false)

    await act(async () => {
      result.current.abort()
      // Let the generator notice the abort signal and exit.
      controllable.push('lost')
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('aborted')
    })
    expect(request.signal?.aborted).toBe(true)
  })

  it('start() is idempotent — calling it twice does not re-trigger', async () => {
    const getAdapterSpy = vi.spyOn(getAdapterModule, 'getAdapter')
    const { result } = renderHook(() => useStreaming())

    act(() => {
      result.current.start(baseRequest)
      result.current.start(baseRequest)
    })

    await controllable.started
    expect(getAdapterSpy).toHaveBeenCalledTimes(1)
  })

  it('aborts the in-flight stream on unmount', async () => {
    const { result, unmount } = renderHook(() => useStreaming())

    act(() => {
      result.current.start(baseRequest)
    })

    const { request } = await controllable.started
    expect(request.signal?.aborted).toBe(false)

    unmount()
    expect(request.signal?.aborted).toBe(true)
  })
})
