import type { AiProviderId } from '../types'

export interface StreamRequest {
  apiKey: string
  prompt: string
  model: string
  signal?: AbortSignal
}

/**
 * Pure function: takes a request, returns an async iterable of text chunks.
 * Each adapter implements this once per provider; consumers don't care which
 * provider they are talking to.
 */
export type StreamAdapter = (request: StreamRequest) => AsyncIterable<string>

/** Canonical errors that consumers can branch on without parsing strings. */
export type StreamErrorKind =
  | 'invalid-key'
  | 'rate-limit'
  | 'network'
  | 'aborted'
  | 'provider-error'
  | 'unknown'

export class StreamError extends Error {
  readonly kind: StreamErrorKind
  override readonly cause: unknown

  constructor(kind: StreamErrorKind, message: string, cause?: unknown) {
    super(message)
    this.name = 'StreamError'
    this.kind = kind
    this.cause = cause
  }
}

/** Map a provider id to its dynamically-loaded adapter implementation. */
export type StreamAdapterRegistry = Record<AiProviderId, () => Promise<StreamAdapter>>
