import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useAiSession } from './useAiSession'

describe('useAiSession', () => {
  it('throws when called outside <AiSessionProvider>', () => {
    expect(() => renderHook(() => useAiSession())).toThrow(/within an <AiSessionProvider>/)
  })
})
