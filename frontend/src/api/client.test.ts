import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch, onSessionExpired } from './client'

interface FetchCall {
  url: string
  init: RequestInit
}

function asUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

/** Mock that returns the same response every call (cloned, so body is fresh). */
function mockFetchAlways(makeResponse: () => Response): {
  fetchMock: ReturnType<typeof vi.fn>
  calls: FetchCall[]
} {
  const calls: FetchCall[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: asUrl(input), init: init ?? {} })
    return Promise.resolve(makeResponse())
  })
  globalThis.fetch = fetchMock
  return { fetchMock, calls }
}

/** Mock that returns a different response per call (cycles to last on overflow). */
function mockFetchSequence(makeResponses: Array<() => Response>): {
  fetchMock: ReturnType<typeof vi.fn>
  calls: FetchCall[]
} {
  const calls: FetchCall[] = []
  let index = 0
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: asUrl(input), init: init ?? {} })
    const factory = makeResponses[Math.min(index, makeResponses.length - 1)]
    index += 1
    return Promise.resolve(factory!())
  })
  globalThis.fetch = fetchMock
  return { fetchMock, calls }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('apiFetch', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'http://api.test')
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.unstubAllEnvs()
  })

  it('prefixes the path with VITE_API_URL', async () => {
    const { calls } = mockFetchAlways(() => jsonResponse(200, { ok: true }))

    await apiFetch('/users/me', { method: 'GET' })

    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toContain('/users/me')
  })

  it('always includes credentials so HttpOnly cookies are sent', async () => {
    const { calls } = mockFetchAlways(() => jsonResponse(200, {}))

    await apiFetch('/x')

    expect(calls[0]?.init.credentials).toBe('include')
  })

  it('serializes the json option and sets Content-Type', async () => {
    const { calls } = mockFetchAlways(() => jsonResponse(200, {}))

    await apiFetch('/x', { method: 'POST', json: { email: 'a@b.c' } })

    expect(calls[0]?.init.body).toBe('{"email":"a@b.c"}')
    const headers = new Headers(calls[0]?.init.headers)
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('does not set Content-Type when no json body is provided', async () => {
    const { calls } = mockFetchAlways(() => jsonResponse(200, {}))

    await apiFetch('/x', { method: 'GET' })

    const headers = new Headers(calls[0]?.init.headers)
    expect(headers.get('Content-Type')).toBeNull()
  })

  it('parses and returns the JSON body on 2xx', async () => {
    mockFetchAlways(() => jsonResponse(200, { id: 'u1', email: 'a@b.c' }))

    const result = await apiFetch<{ id: string; email: string }>('/x')

    expect(result).toEqual({ id: 'u1', email: 'a@b.c' })
  })

  it('returns undefined on 204 No Content', async () => {
    mockFetchAlways(() => new Response(null, { status: 204 }))

    const result = await apiFetch<void>('/x', { method: 'POST' })

    expect(result).toBeUndefined()
  })

  it('throws ApiError with body=null when the error response is not JSON', async () => {
    mockFetchAlways(
      () => new Response('plain text', { status: 500, statusText: 'Internal Server Error' }),
    )

    await expect(apiFetch('/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      body: null,
    })
  })

  describe('auto-refresh on 401', () => {
    it('attempts /auth/refresh once on 401, then retries the original request', async () => {
      const { calls } = mockFetchSequence([
        () => jsonResponse(401, { message: 'expired' }),
        () => new Response(null, { status: 204 }),
        () => jsonResponse(200, { id: 'u1' }),
      ])

      const result = await apiFetch<{ id: string }>('/users/me', { method: 'GET' })

      expect(result).toEqual({ id: 'u1' })
      expect(calls).toHaveLength(3)
      expect(calls[0]?.url).toContain('/users/me')
      expect(calls[1]?.url).toContain('/auth/refresh')
      expect(calls[2]?.url).toContain('/users/me')
    })

    it('propagates the original 401 when refresh also fails', async () => {
      mockFetchSequence([
        () => jsonResponse(401, { message: 'expired' }),
        () => jsonResponse(401, { message: 'no refresh' }),
      ])

      await expect(apiFetch('/users/me')).rejects.toMatchObject({
        name: 'ApiError',
        status: 401,
      })
    })

    it('notifies session-expired listeners when refresh fails', async () => {
      mockFetchSequence([() => jsonResponse(401, null), () => jsonResponse(401, null)])

      const listener = vi.fn()
      const unsubscribe = onSessionExpired(listener)

      await expect(apiFetch('/users/me')).rejects.toBeInstanceOf(ApiError)

      expect(listener).toHaveBeenCalledTimes(1)
      unsubscribe()
    })

    it('does not attempt refresh when /auth/refresh itself returns 401', async () => {
      const { calls } = mockFetchSequence([() => jsonResponse(401, null)])

      await expect(apiFetch('/auth/refresh', { method: 'POST' })).rejects.toMatchObject({
        status: 401,
      })

      // Only one call: the refresh path is exempt from the auto-retry.
      expect(calls).toHaveLength(1)
    })

    it('does not attempt refresh on /auth/login', async () => {
      const { calls } = mockFetchSequence([() => jsonResponse(401, null)])

      await expect(
        apiFetch('/auth/login', { method: 'POST', json: { email: 'a', password: 'b' } }),
      ).rejects.toMatchObject({ status: 401 })

      expect(calls).toHaveLength(1)
    })

    it('skipRefresh: true bypasses the auto-refresh', async () => {
      const { calls } = mockFetchSequence([() => jsonResponse(401, null)])

      await expect(apiFetch('/x', { skipRefresh: true })).rejects.toMatchObject({
        status: 401,
      })

      expect(calls).toHaveLength(1)
    })

    it('does not call session-expired when refresh succeeds', async () => {
      mockFetchSequence([
        () => jsonResponse(401, null),
        () => new Response(null, { status: 204 }),
        () => jsonResponse(200, { ok: true }),
      ])

      const listener = vi.fn()
      const unsubscribe = onSessionExpired(listener)

      await apiFetch('/x')

      expect(listener).not.toHaveBeenCalled()
      unsubscribe()
    })
  })
})
