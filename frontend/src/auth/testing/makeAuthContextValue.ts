import { vi } from 'vitest'
import type { AuthContextValue } from '../AuthContext'
import type { AuthState } from '../state'

/**
 * Build a stub AuthContextValue for tests. Pass `state` to control the
 * status; the action functions default to no-op mocks but can be overridden.
 */
export function makeAuthContextValue(
  state: AuthState,
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    state,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}
