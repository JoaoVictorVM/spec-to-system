import { createContext } from 'react'
import type { PublicUser } from '../api'
import type { AuthState } from './state'

export interface AuthContextValue {
  state: AuthState
  login: (email: string, password: string) => Promise<PublicUser>
  register: (email: string, password: string) => Promise<PublicUser>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
