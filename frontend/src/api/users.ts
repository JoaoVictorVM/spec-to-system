import { apiFetch } from './client'
import type { PublicUser } from './types'

export const usersApi = {
  me(): Promise<PublicUser> {
    return apiFetch<PublicUser>('/users/me', { method: 'GET' })
  },

  updateMe(input: { email?: string; password?: string }): Promise<PublicUser> {
    return apiFetch<PublicUser>('/users/me', {
      method: 'PATCH',
      json: input,
    })
  },

  deleteMe(): Promise<void> {
    return apiFetch<void>('/users/me', { method: 'DELETE' })
  },
}
