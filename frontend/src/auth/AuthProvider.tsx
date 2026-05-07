import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { ApiError, authApi, onSessionExpired, usersApi, type PublicUser } from '../api'
import { AuthContext, type AuthContextValue } from './AuthContext'
import { authReducer, initialAuthState } from './state'

interface AuthProviderProps {
  children: ReactNode
}

function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)

  // Hydrate session once on mount: ask the backend who we are. A 401 means
  // there's no active session — that's a successful "no session" answer, not
  // a crash.
  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const user = await usersApi.me()
        if (!cancelled) dispatch({ type: 'HYDRATE_SUCCESS', user })
      } catch (error) {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) {
          dispatch({ type: 'HYDRATE_FAILED' })
        } else {
          // Network error or unexpected response: treat as unauthenticated so
          // the app keeps booting; the user can still navigate to /login.
          dispatch({ type: 'HYDRATE_FAILED' })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // The API client emits this event when an auto-refresh attempt fails — the
  // user's session has expired mid-flight and we should reflect that in state.
  useEffect(() => {
    return onSessionExpired(() => {
      dispatch({ type: 'SESSION_EXPIRED' })
    })
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<PublicUser> => {
    const session = await authApi.login(email, password)
    dispatch({ type: 'LOGIN_SUCCESS', user: session.user })
    return session.user
  }, [])

  const register = useCallback(async (email: string, password: string): Promise<PublicUser> => {
    return authApi.register(email, password)
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout()
    } finally {
      // Always transition to unauthenticated, even if the server logout call
      // fails (the cookies were probably already invalid).
      dispatch({ type: 'LOGOUT' })
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ state, login, register, logout }),
    [state, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
