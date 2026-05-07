import type { ReactNode } from 'react'
import { AuthContext, type AuthContextValue } from '../AuthContext'

interface AuthContextHarnessProps {
  value: AuthContextValue
  children: ReactNode
}

export function AuthContextHarness({ value, children }: AuthContextHarnessProps) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
