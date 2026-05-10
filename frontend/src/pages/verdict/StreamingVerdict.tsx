import { useEffect, useRef } from 'react'
import { findProvider, useAiSession } from '../../ai'
import { useStreaming } from '../../ai/streaming'
import { ApiError, specificationsApi } from '../../api'
import { useAuth } from '../../auth'
import StreamingMarkdown from '../../components/ui/StreamingMarkdown'
import PromptPanel from './components/PromptPanel'
import StreamingErrorPanel from './components/StreamingErrorPanel'
import VerdictHeader from './components/VerdictHeader'

interface StreamingVerdictProps {
  sessionCode: string
  prompt: string
}

function StreamingVerdict({ sessionCode, prompt }: StreamingVerdictProps) {
  const { providerId, apiKey } = useAiSession()
  const { state: authState } = useAuth()
  const stream = useStreaming()
  const persistedRef = useRef(false)

  // Once the stream finishes, persist the (prompt, response) pair when the
  // user is authenticated. Anonymous users can only re-access via the URL.
  function handleComplete(content: string): void {
    if (persistedRef.current) return
    if (authState.status !== 'authenticated') return
    persistedRef.current = true

    void specificationsApi
      .create({ sessionCode, prompt, response: content })
      .catch((error: unknown) => {
        // Best-effort: if persistence fails, the spec is still visible on
        // screen. Don't surface a blocking error — log for diagnostics.
        if (error instanceof ApiError) {
          console.warn(`Could not persist specification ${sessionCode}: ${String(error.status)}`)
        } else {
          console.warn('Could not persist specification', error)
        }
      })
  }

  useEffect(() => {
    if (providerId === null || apiKey.trim().length === 0) return
    const provider = findProvider(providerId)
    stream.start({
      providerId,
      apiKey,
      model: provider.defaultModel,
      prompt,
      onComplete: handleComplete,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, apiKey, prompt, stream])

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
              <p className="mt-6 text-sm text-text-muted">Geração interrompida.</p>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

export default StreamingVerdict
