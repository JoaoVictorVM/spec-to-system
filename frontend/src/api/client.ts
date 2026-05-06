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
}

export async function apiFetch<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { json, headers, ...rest } = init
  const finalHeaders = new Headers(headers)
  let body: BodyInit | undefined

  if (json !== undefined) {
    finalHeaders.set('Content-Type', 'application/json')
    body = JSON.stringify(json)
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    body,
    headers: finalHeaders,
    credentials: 'include',
  })

  if (response.status === 204) {
    return undefined as T
  }

  const responseBody: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText, responseBody)
  }

  return responseBody as T
}
