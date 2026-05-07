import { describe, expect, it } from 'vitest'
import type { PublicUser } from '../api'
import { authReducer, initialAuthState, type AuthState } from './state'

const user: PublicUser = {
  id: 'u-1',
  email: 'a@b.c',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('authReducer', () => {
  it('starts in loading state', () => {
    expect(initialAuthState).toEqual({ status: 'loading' })
  })

  it('HYDRATE_SUCCESS transitions to authenticated with the user', () => {
    const next = authReducer(initialAuthState, { type: 'HYDRATE_SUCCESS', user })
    expect(next).toEqual({ status: 'authenticated', user })
  })

  it('HYDRATE_FAILED transitions to unauthenticated', () => {
    expect(authReducer(initialAuthState, { type: 'HYDRATE_FAILED' })).toEqual({
      status: 'unauthenticated',
    })
  })

  it('LOGIN_SUCCESS transitions to authenticated', () => {
    const previous: AuthState = { status: 'unauthenticated' }
    expect(authReducer(previous, { type: 'LOGIN_SUCCESS', user })).toEqual({
      status: 'authenticated',
      user,
    })
  })

  it('LOGOUT transitions to unauthenticated', () => {
    const previous: AuthState = { status: 'authenticated', user }
    expect(authReducer(previous, { type: 'LOGOUT' })).toEqual({ status: 'unauthenticated' })
  })

  it('SESSION_EXPIRED transitions to unauthenticated', () => {
    const previous: AuthState = { status: 'authenticated', user }
    expect(authReducer(previous, { type: 'SESSION_EXPIRED' })).toEqual({
      status: 'unauthenticated',
    })
  })
})
