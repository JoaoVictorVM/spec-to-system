import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useAuth } from './useAuth'

describe('useAuth', () => {
  it('throws when called outside of an <AuthProvider>', () => {
    // The error is thrown during render, so renderHook surfaces it.
    expect(() => renderHook(() => useAuth())).toThrow(/within an <AuthProvider>/)
  })
})
