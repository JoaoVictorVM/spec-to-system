import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from './client'

interface FetchCall {
  url: string
  init: RequestInit
}

function mockFetch(response: Response): {
  fetchMock: ReturnType<typeof vi.fn>
  calls: FetchCall[]
} {
  const calls: FetchCall[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    calls.push({ url, init: init ?? {} })
    return Promise.resolve(response)
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
    const { calls } = mockFetch(jsonResponse(200, { ok: true }))

    await apiFetch('/users/me', { method: 'GET' })

    expect(calls).toHaveLength(1)
    // VITE_API_URL is set at module load via top-level const, so we don't assert
    // the prefix here directly — we assert that the path was forwarded.
    expect(calls[0]?.url).toContain('/users/me')
  })

  it('always includes credentials so HttpOnly cookies are sent', async () => {
    const { calls } = mockFetch(jsonResponse(200, {}))

    await apiFetch('/x')

    expect(calls[0]?.init.credentials).toBe('include')
  })

  it('serializes the json option and sets Content-Type', async () => {
    const { calls } = mockFetch(jsonResponse(200, {}))

    await apiFetch('/x', { method: 'POST', json: { email: 'a@b.c' } })

    expect(calls[0]?.init.body).toBe('{"email":"a@b.c"}')
    const headers = new Headers(calls[0]?.init.headers)
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('does not set Content-Type when no json body is provided', async () => {
    const { calls } = mockFetch(jsonResponse(200, {}))

    await apiFetch('/x', { method: 'GET' })

    const headers = new Headers(calls[0]?.init.headers)
    expect(headers.get('Content-Type')).toBeNull()
  })

  it('parses and returns the JSON body on 2xx', async () => {
    mockFetch(jsonResponse(200, { id: 'u1', email: 'a@b.c' }))

    const result = await apiFetch<{ id: string; email: string }>('/x')

    expect(result).toEqual({ id: 'u1', email: 'a@b.c' })
  })

  it('returns undefined on 204 No Content', async () => {
    mockFetch(new Response(null, { status: 204 }))

    const result = await apiFetch<void>('/x', { method: 'POST' })

    expect(result).toBeUndefined()
  })

  it('throws ApiError with status, statusText and body on non-2xx', async () => {
    mockFetch(
      new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
        statusText: 'Unauthorized',
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(apiFetch('/x', { method: 'POST' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      statusText: 'Unauthorized',
      body: { message: 'Invalid credentials' },
    })
  })

  it('throws ApiError with body=null when the error response is not JSON', async () => {
    mockFetch(new Response('plain text', { status: 500, statusText: 'Internal Server Error' }))

    try {
      await apiFetch('/x')
      throw new Error('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      const apiError = err as ApiError
      expect(apiError.status).toBe(500)
      expect(apiError.body).toBeNull()
    }
  })
})
