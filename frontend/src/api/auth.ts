import { apiFetch } from './client'
import type { AuthSession, PublicUser } from './types'

export const authApi = {
  register(email: string, password: string): Promise<PublicUser> {
    return apiFetch<PublicUser>('/auth/register', {
      method: 'POST',
      json: { email, password },
    })
  },

  login(email: string, password: string): Promise<AuthSession> {
    return apiFetch<AuthSession>('/auth/login', {
      method: 'POST',
      json: { email, password },
    })
  },

  refresh(): Promise<AuthSession> {
    return apiFetch<AuthSession>('/auth/refresh', { method: 'POST' })
  },

  logout(): Promise<void> {
    return apiFetch<void>('/auth/logout', { method: 'POST' })
  },
}
