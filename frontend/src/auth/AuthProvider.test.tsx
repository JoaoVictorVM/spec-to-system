import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, type AuthSession, type PublicUser } from '../api'
import { authApi } from '../api/auth'
import * as clientModule from '../api/client'
import { usersApi } from '../api/users'
import AuthProvider from './AuthProvider'
import { useAuth } from './useAuth'

const persistedUser: PublicUser = {
  id: 'u-1',
  email: 'a@b.c',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function StatusProbe() {
  const { state } = useAuth()
  if (state.status === 'authenticated') {
    return <p data-testid="status">authenticated:{state.user.email}</p>
  }
  return <p data-testid="status">{state.status}</p>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.spyOn(usersApi, 'me').mockResolvedValue(persistedUser)
    vi.spyOn(authApi, 'login').mockResolvedValue({ user: persistedUser } satisfies AuthSession)
    vi.spyOn(authApi, 'register').mockResolvedValue(persistedUser)
    vi.spyOn(authApi, 'logout').mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('hydrates to authenticated when /users/me succeeds', async () => {
    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent(`authenticated:${persistedUser.email}`)
    })
  })

  it('hydrates to unauthenticated on 401 from /users/me', async () => {
    vi.spyOn(usersApi, 'me').mockRejectedValueOnce(
      new ApiError(401, 'Unauthorized', { message: 'no session' }),
    )

    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    })
  })

  it('hydrates to unauthenticated on a network error (does not crash)', async () => {
    vi.spyOn(usersApi, 'me').mockRejectedValueOnce(new TypeError('Failed to fetch'))

    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    })
  })

  it('login transitions to authenticated and returns the user', async () => {
    vi.spyOn(usersApi, 'me').mockRejectedValueOnce(new ApiError(401, 'Unauthorized', null))

    let result: PublicUser | undefined
    function Trigger() {
      const { state, login } = useAuth()
      return (
        <>
          <p data-testid="status">{state.status}</p>
          <button
            onClick={() => {
              void login('a@b.c', 'pw').then((u) => {
                result = u
              })
            }}
          >
            login
          </button>
        </>
      )
    }

    render(
      <AuthProvider>
        <Trigger />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    })

    act(() => {
      screen.getByText('login').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })
    expect(result).toEqual(persistedUser)
  })

  it('logout transitions back to unauthenticated', async () => {
    function Trigger() {
      const { state, logout } = useAuth()
      return (
        <>
          <p data-testid="status">{state.status}</p>
          <button
            onClick={() => {
              void logout()
            }}
          >
            logout
          </button>
        </>
      )
    }

    render(
      <AuthProvider>
        <Trigger />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })

    act(() => {
      screen.getByText('logout').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    })
  })

  it('logout transitions to unauthenticated even when the API call fails', async () => {
    vi.spyOn(authApi, 'logout').mockRejectedValueOnce(
      new ApiError(500, 'Internal Server Error', null),
    )

    function Trigger() {
      const { state, logout } = useAuth()
      return (
        <>
          <p data-testid="status">{state.status}</p>
          <button
            onClick={() => {
              void logout().catch(() => undefined)
            }}
          >
            logout
          </button>
        </>
      )
    }

    render(
      <AuthProvider>
        <Trigger />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })

    act(() => {
      screen.getByText('logout').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    })
  })

  it('register calls the api and does not by itself authenticate the session', async () => {
    vi.spyOn(usersApi, 'me').mockRejectedValueOnce(new ApiError(401, 'Unauthorized', null))

    let registered: PublicUser | undefined
    function Trigger() {
      const { state, register } = useAuth()
      return (
        <>
          <p data-testid="status">{state.status}</p>
          <button
            onClick={() => {
              void register('a@b.c', 'pw').then((u) => {
                registered = u
              })
            }}
          >
            register
          </button>
        </>
      )
    }

    render(
      <AuthProvider>
        <Trigger />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    })

    act(() => {
      screen.getByText('register').click()
    })

    await waitFor(() => {
      expect(registered).toEqual(persistedUser)
    })
    // Register should NOT have set authenticated state by itself (the user
    // logs in separately).
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
  })

  it('dispatches SESSION_EXPIRED when the API client signals an expired session', async () => {
    let capturedListener: (() => void) | undefined
    vi.spyOn(clientModule, 'onSessionExpired').mockImplementation((listener) => {
      capturedListener = listener
      return () => undefined
    })

    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent(`authenticated:${persistedUser.email}`)
    })

    expect(capturedListener).toBeDefined()
    act(() => {
      capturedListener?.()
    })

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    })
  })

  it('unsubscribes from session-expired on unmount', () => {
    const unsubscribe = vi.fn()
    vi.spyOn(clientModule, 'onSessionExpired').mockReturnValue(unsubscribe)

    const { unmount } = render(
      <AuthProvider>
        <p>child</p>
      </AuthProvider>,
    )

    unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
