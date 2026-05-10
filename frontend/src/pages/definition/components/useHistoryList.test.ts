import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, type Specification } from '../../../api'
import { specificationsApi } from '../../../api/specifications'
import { useHistoryList } from './useHistoryList'

function makeSpec(seed: string): Specification {
  return {
    id: `id-${seed}`,
    sessionCode: seed,
    prompt: `prompt for ${seed}`,
    response: `response for ${seed}`,
    userId: 'u-1',
    createdAt: '2026-01-01T00:00:00Z',
  }
}

describe('useHistoryList', () => {
  beforeEach(() => {
    vi.spyOn(specificationsApi, 'list').mockResolvedValue({
      items: [makeSpec('a'), makeSpec('b')],
      nextCursor: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not fetch when disabled and stays in idle state', () => {
    const listSpy = vi.spyOn(specificationsApi, 'list')
    const { result } = renderHook(() => useHistoryList(false))
    expect(result.current.status).toBe('idle')
    expect(listSpy).not.toHaveBeenCalled()
  })

  it('fetches the first page on mount when enabled', async () => {
    const listSpy = vi.spyOn(specificationsApi, 'list')
    const { result } = renderHook(() => useHistoryList(true))

    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })
    expect(result.current.items.map((s) => s.sessionCode)).toEqual(['a', 'b'])
    expect(listSpy).toHaveBeenCalledWith({ cursor: undefined, limit: 10 })
  })

  it('appends results when loadMore is called with a nextCursor', async () => {
    vi.spyOn(specificationsApi, 'list')
      .mockResolvedValueOnce({ items: [makeSpec('a'), makeSpec('b')], nextCursor: 'cur-1' })
      .mockResolvedValueOnce({ items: [makeSpec('c')], nextCursor: null })

    const { result } = renderHook(() => useHistoryList(true))
    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })

    act(() => {
      result.current.loadMore()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('ready')
      expect(result.current.items.map((s) => s.sessionCode)).toEqual(['a', 'b', 'c'])
    })
    expect(result.current.nextCursor).toBeNull()
  })

  it('loadMore is a no-op when there is no nextCursor', async () => {
    const listSpy = vi.spyOn(specificationsApi, 'list').mockResolvedValue({
      items: [makeSpec('a')],
      nextCursor: null,
    })
    const { result } = renderHook(() => useHistoryList(true))
    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })

    listSpy.mockClear()
    act(() => {
      result.current.loadMore()
    })
    expect(listSpy).not.toHaveBeenCalled()
  })

  it('captures ApiError into the error state', async () => {
    vi.spyOn(specificationsApi, 'list').mockRejectedValue(new ApiError(500, 'Internal', null))

    const { result } = renderHook(() => useHistoryList(true))

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.error?.status).toBe(500)
  })

  it('refetch resets the list and reloads from the start', async () => {
    const listSpy = vi.spyOn(specificationsApi, 'list').mockResolvedValue({
      items: [makeSpec('a')],
      nextCursor: null,
    })

    const { result } = renderHook(() => useHistoryList(true))
    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })

    listSpy.mockResolvedValueOnce({ items: [makeSpec('b'), makeSpec('a')], nextCursor: null })

    act(() => {
      result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.items.map((s) => s.sessionCode)).toEqual(['b', 'a'])
    })
  })
})
