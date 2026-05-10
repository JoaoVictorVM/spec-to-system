import { useEffect, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { useAiSession } from '../../ai'
import { ApiError, specificationsApi, type Specification } from '../../api'
import { ROUTE_PATHS } from '../../routes/paths'
import type { VerdictNavigationState } from '../definition/components/PromptForm'
import NotFoundVerdict from './NotFoundVerdict'
import SavedVerdict from './SavedVerdict'
import StreamingVerdict from './StreamingVerdict'

type SavedFetchState =
  | { status: 'loading' }
  | { status: 'loaded'; specification: Specification }
  | { status: 'not-found' }
  | { status: 'error' }

function VerdictPage() {
  const { sessionCode } = useParams<{ sessionCode: string }>()
  const location = useLocation()
  const { providerId, apiKey } = useAiSession()
  const navState = location.state as VerdictNavigationState | null
  const prompt = navState?.prompt ?? null

  const isStreamingFlow =
    sessionCode !== undefined && prompt !== null && providerId !== null && apiKey.trim().length > 0

  const [savedState, setSavedState] = useState<SavedFetchState>({ status: 'loading' })

  // Revisit-by-URL: when there's no prompt to stream, fetch the saved
  // specification from the public endpoint.
  useEffect(() => {
    if (sessionCode === undefined) return
    if (isStreamingFlow) return

    let cancelled = false
    // Reset to loading whenever the sessionCode changes — this is the
    // synchronize-with-URL pattern that effects exist for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedState({ status: 'loading' })

    void (async () => {
      try {
        const specification = await specificationsApi.findByCode(sessionCode)
        if (!cancelled) setSavedState({ status: 'loaded', specification })
      } catch (error) {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 404) {
          setSavedState({ status: 'not-found' })
        } else {
          setSavedState({ status: 'error' })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [sessionCode, isStreamingFlow])

  if (sessionCode === undefined) {
    return <Navigate to={ROUTE_PATHS.definition} replace />
  }

  if (isStreamingFlow && prompt !== null) {
    return <StreamingVerdict sessionCode={sessionCode} prompt={prompt} />
  }

  if (savedState.status === 'loading') {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-screen-md px-6 py-15 text-center text-sm text-text-muted">
          Carregando especificação…
        </div>
      </main>
    )
  }

  if (savedState.status === 'loaded') {
    return <SavedVerdict specification={savedState.specification} />
  }

  // not-found or error: render the 404-style view either way (errors are
  // typically transient backend hiccups, treated as "couldn't find it").
  return <NotFoundVerdict sessionCode={sessionCode} />
}

export default VerdictPage
