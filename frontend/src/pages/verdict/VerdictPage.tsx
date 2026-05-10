import { useEffect } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { findProvider, useAiSession } from '../../ai'
import { useStreaming } from '../../ai/streaming'
import StreamingMarkdown from '../../components/ui/StreamingMarkdown'
import { ROUTE_PATHS } from '../../routes/paths'
import type { VerdictNavigationState } from '../definition/components/PromptForm'
import PromptPanel from './components/PromptPanel'
import StreamingErrorPanel from './components/StreamingErrorPanel'
import VerdictHeader from './components/VerdictHeader'

function VerdictPage() {
  const { sessionCode } = useParams<{ sessionCode: string }>()
  const location = useLocation()
  const { providerId, apiKey } = useAiSession()
  const navState = location.state as VerdictNavigationState | null
  const prompt = navState?.prompt ?? null

  const stream = useStreaming()

  // Auto-start streaming when we have everything we need. The hook itself is
  // idempotent (latched), so this useEffect can fire safely.
  useEffect(() => {
    if (!sessionCode || prompt === null) return
    if (providerId === null || apiKey.trim().length === 0) return
    const provider = findProvider(providerId)
    stream.start({
      providerId,
      apiKey,
      model: provider.defaultModel,
      prompt,
    })
  }, [sessionCode, prompt, providerId, apiKey, stream])

  // Without a sessionCode the URL is malformed — bounce back to /definition.
  if (!sessionCode) {
    return <Navigate to={ROUTE_PATHS.definition} replace />
  }

  // No prompt in location.state means the user opened the URL directly. The
  // revisit-by-URL flow (fetching the saved spec) lands in checkpoint 5.
  if (prompt === null) {
    return <Navigate to={ROUTE_PATHS.definition} replace />
  }

  // Provider/key missing: user navigated here without setting up — kick them
  // back to /definition to fill in the form.
  if (providerId === null || apiKey.trim().length === 0) {
    return <Navigate to={ROUTE_PATHS.definition} replace />
  }

  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-screen-lg flex-col gap-6 px-6 py-10 md:py-12">
        <VerdictHeader sessionCode={sessionCode} />
        <PromptPanel prompt={prompt} />

        {stream.status === 'error' && stream.error !== null ? (
          <StreamingErrorPanel kind={stream.error.kind} message={stream.error.message} />
        ) : (
          <section
            aria-label="Especificação gerada"
            aria-busy={stream.status === 'streaming'}
            className="rounded-md border border-border bg-surface px-6 py-6 md:px-8 md:py-8"
          >
            <StreamingMarkdown content={stream.content} streaming={stream.status === 'streaming'} />
            {stream.status === 'aborted' && (
              <p className="mt-6 text-sm text-text-muted">
                Geração interrompida.{' '}
                <button
                  type="button"
                  onClick={() => {
                    window.location.reload()
                  }}
                  className="text-accent transition-colors duration-fast hover:text-accent-hover"
                >
                  Recarregar
                </button>
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

export default VerdictPage
