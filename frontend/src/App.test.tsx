import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ApiError } from './api'
import { usersApi } from './api/users'

describe('App', () => {
  beforeEach(() => {
    // App boots AuthProvider, which calls /users/me on mount. In tests we
    // simulate "no active session" so the smoke test stays deterministic.
    vi.spyOn(usersApi, 'me').mockRejectedValue(new ApiError(401, 'Unauthorized', null))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mounts the router and renders the landing page at /', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /landing/i })).toBeInTheDocument()
  })
})
