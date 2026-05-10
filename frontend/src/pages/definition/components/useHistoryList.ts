import { useCallback, useEffect, useState } from 'react'
import { ApiError, specificationsApi, type Specification } from '../../../api'

const PAGE_SIZE = 10

export type HistoryStatus = 'idle' | 'loading' | 'ready' | 'loading-more' | 'error'

export interface HistoryListState {
  status: HistoryStatus
  items: Specification[]
  nextCursor: string | null
  error: ApiError | null
}

export interface UseHistoryListResult extends HistoryListState {
  /** Loads the next page (no-op when there is no nextCursor or already loading). */
  loadMore: () => void
  /** Refetches from the start, useful after creating a new specification. */
  refetch: () => void
}

const INITIAL_STATE: HistoryListState = {
  status: 'idle',
  items: [],
  nextCursor: null,
  error: null,
}

/**
 * Fetches the authenticated user's specifications with cursor-based
 * pagination. The caller decides when to mount this hook (only when logged
 * in) — the hook itself does not check auth.
 */
export function useHistoryList(enabled: boolean): UseHistoryListResult {
  const [state, setState] = useState<HistoryListState>(INITIAL_STATE)

  const fetchPage = useCallback(async (cursor: string | undefined): Promise<void> => {
    const isInitial = cursor === undefined
    // Drop previous items on a fresh load so a stale list from a previous
    // user/session never flashes before the new data arrives.
    setState((prev) => ({
      status: isInitial ? 'loading' : 'loading-more',
      items: isInitial ? [] : prev.items,
      nextCursor: isInitial ? null : prev.nextCursor,
      error: null,
    }))
    try {
      const result = await specificationsApi.list({ cursor, limit: PAGE_SIZE })
      setState((prev) => ({
        status: 'ready',
        items: isInitial ? result.items : [...prev.items, ...result.items],
        nextCursor: result.nextCursor,
        error: null,
      }))
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: apiError,
      }))
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    // Intentional: this is a data-fetching hook that owns its own state. The
    // React docs suggest Suspense for new code, but we're not on that pattern
    // yet — fetching on mount is the right call here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPage(undefined)
  }, [enabled, fetchPage])

  const loadMore = useCallback(() => {
    if (state.status === 'loading' || state.status === 'loading-more') return
    if (state.nextCursor === null) return
    void fetchPage(state.nextCursor)
  }, [state.status, state.nextCursor, fetchPage])

  const refetch = useCallback(() => {
    void fetchPage(undefined)
  }, [fetchPage])

  return { ...state, loadMore, refetch }
}
