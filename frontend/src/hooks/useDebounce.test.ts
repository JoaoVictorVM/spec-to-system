import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value synchronously', () => {
    const { result } = renderHook(() => useDebounce('hello', 200))
    expect(result.current).toBe('hello')
  })

  it('updates after the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    expect(result.current).toBe('a') // not yet

    act(() => {
      vi.advanceTimersByTime(199)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('b')
  })

  it('cancels pending updates when the value changes again', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(150)
    })
    rerender({ value: 'c' })
    act(() => {
      vi.advanceTimersByTime(150)
    })
    // 'b' should never have been emitted because 'c' arrived first
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(result.current).toBe('c')
  })
})
