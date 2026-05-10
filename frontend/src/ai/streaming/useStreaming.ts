import { useCallback, useEffect, useRef, useState } from 'react'
import type { AiProviderId } from '../types'
import { getAdapter } from './getAdapter'
import { StreamError } from './types'

export type StreamingStatus = 'idle' | 'streaming' | 'completed' | 'error' | 'aborted'

export interface StreamingStartRequest {
  providerId: AiProviderId
  apiKey: string
  model: string
  prompt: string
  /** Called once with the full text after a successful stream. */
  onComplete?: (content: string) => void
  /** Called once when the stream ends in error (excluding 'aborted'). */
  onError?: (error: StreamError) => void
}

export interface StreamingState {
  status: StreamingStatus
  content: string
  error: StreamError | null
}

export interface UseStreamingResult extends StreamingState {
  start: (request: StreamingStartRequest) => void
  abort: () => void
}

const INITIAL_STATE: StreamingState = {
  status: 'idle',
  content: '',
  error: null,
}

/**
 * Hook that drives a single streaming session against a chosen provider.
 * Auto-aborts the in-flight request on unmount; callers don't need to
 * manage cleanup. Designed for one-shot use per mounted component instance.
 */
export function useStreaming(): UseStreamingResult {
  const [state, setState] = useState<StreamingState>(INITIAL_STATE)
  const controllerRef = useRef<AbortController | null>(null)
  // Latch: prevent re-triggering the stream from re-renders / strict-mode.
  const startedRef = useRef(false)

  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
    }
  }, [])

  const start = useCallback((request: StreamingStartRequest) => {
    if (startedRef.current) return
    startedRef.current = true

    const controller = new AbortController()
    controllerRef.current = controller

    setState({ status: 'streaming', content: '', error: null })

    void (async () => {
      try {
        const adapter = await getAdapter(request.providerId)
        let accumulated = ''
        for await (const chunk of adapter({
          apiKey: request.apiKey,
          prompt: request.prompt,
          model: request.model,
          signal: controller.signal,
        })) {
          if (controller.signal.aborted) break
          accumulated += chunk
          // Functional update so we don't depend on the stale closure value.
          setState((prev) => ({ ...prev, content: prev.content + chunk }))
        }
        if (controller.signal.aborted) {
          setState((prev) => ({ ...prev, status: 'aborted' }))
          return
        }
        setState((prev) => ({ ...prev, status: 'completed' }))
        request.onComplete?.(accumulated)
      } catch (error) {
        const streamError =
          error instanceof StreamError
            ? error
            : new StreamError('unknown', 'Erro inesperado durante o streaming', error)

        if (streamError.kind === 'aborted') {
          setState((prev) => ({ ...prev, status: 'aborted' }))
          return
        }
        setState((prev) => ({ ...prev, status: 'error', error: streamError }))
        request.onError?.(streamError)
      }
    })()
  }, [])

  const abort = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  return { ...state, start, abort }
}
