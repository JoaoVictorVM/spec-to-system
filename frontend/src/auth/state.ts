import type { PublicUser } from '../api'

export type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: PublicUser }
  | { status: 'unauthenticated' }

export const initialAuthState: AuthState = { status: 'loading' }

export type AuthAction =
  | { type: 'HYDRATE_SUCCESS'; user: PublicUser }
  | { type: 'HYDRATE_FAILED' }
  | { type: 'LOGIN_SUCCESS'; user: PublicUser }
  | { type: 'LOGOUT' }
  | { type: 'SESSION_EXPIRED' }

export function authReducer(_state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'HYDRATE_SUCCESS':
    case 'LOGIN_SUCCESS':
      return { status: 'authenticated', user: action.user }
    case 'HYDRATE_FAILED':
    case 'LOGOUT':
    case 'SESSION_EXPIRED':
      return { status: 'unauthenticated' }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}
