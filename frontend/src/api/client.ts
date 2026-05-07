function resolveBaseUrl(): string {
  const value: unknown = import.meta.env['VITE_API_URL']
  return typeof value === 'string' && value.length > 0 ? value : 'http://localhost:3000'
}

const BASE_URL = resolveBaseUrl()

export class ApiError extends Error {
  readonly status: number
  readonly statusText: string
  readonly body: unknown

  constructor(status: number, statusText: string, body: unknown) {
    super(`API ${String(status)} ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.body = body
  }
}

export interface ApiRequestInit extends Omit<RequestInit, 'body'> {
  /** Object that will be JSON-stringified. */
  json?: unknown
  /** Internal: skip the auto-refresh-on-401 retry for this specific call. */
  skipRefresh?: boolean
}

// Paths that participate in the auth flow itself — refreshing on a 401
// from one of these would either loop or be meaningless.
const REFRESH_EXEMPT_PATHS = new Set(['/auth/refresh', '/auth/login', '/auth/logout'])

let pendingRefresh: Promise<void> | null = null

type SessionExpiredListener = () => void
const sessionExpiredListeners = new Set<SessionExpiredListener>()

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener)
  return () => {
    sessionExpiredListeners.delete(listener)
  }
}

function notifySessionExpired(): void {
  for (const listener of sessionExpiredListeners) {
    try {
      listener()
    } catch {
      // Listeners must not break the auth flow.
    }
  }
}

async function refreshSession(): Promise<void> {
  pendingRefresh ??= (async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new ApiError(response.status, response.statusText, null)
      }
    } finally {
      pendingRefresh = null
    }
  })()
  return pendingRefresh
}

async function rawFetch(path: string, init: ApiRequestInit): Promise<Response> {
  const { json, headers, skipRefresh, ...rest } = init
  const finalHeaders = new Headers(headers)
  let body: BodyInit | undefined

  if (json !== undefined) {
    finalHeaders.set('Content-Type', 'application/json')
    body = JSON.stringify(json)
  }

  return fetch(`${BASE_URL}${path}`, {
    ...rest,
    body,
    headers: finalHeaders,
    credentials: 'include',
  })
}

export async function apiFetch<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  let response = await rawFetch(path, init)

  // Auto-refresh on 401: try /auth/refresh once, then replay the original
  // request. Skip for the auth-flow endpoints themselves and for callers
  // that opted out via `skipRefresh: true`.
  const eligibleForRefresh =
    response.status === 401 && init.skipRefresh !== true && !REFRESH_EXEMPT_PATHS.has(path)

  if (eligibleForRefresh) {
    try {
      await refreshSession()
      response = await rawFetch(path, init)
    } catch {
      // Refresh itself failed: notify subscribers (AuthProvider) and let the
      // original 401 propagate to the caller.
      notifySessionExpired()
    }
  }

  if (response.status === 204) {
    return undefined as T
  }

  const responseBody: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText, responseBody)
  }

  return responseBody as T
}
