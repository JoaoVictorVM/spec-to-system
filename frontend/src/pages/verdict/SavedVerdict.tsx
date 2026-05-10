import type { Specification } from '../../api'
import StreamingMarkdown from '../../components/ui/StreamingMarkdown'
import PromptPanel from './components/PromptPanel'
import VerdictHeader from './components/VerdictHeader'

interface SavedVerdictProps {
  specification: Specification
}

function SavedVerdict({ specification }: SavedVerdictProps) {
  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-screen-lg flex-col gap-6 px-6 py-10 md:py-12">
        <VerdictHeader sessionCode={specification.sessionCode} />
        <PromptPanel prompt={specification.prompt} />
        <section
          aria-label="Especificação gerada"
          className="rounded-md border border-border bg-surface px-6 py-6 md:px-8 md:py-8"
        >
          <StreamingMarkdown content={specification.response} streaming={false} />
        </section>
      </div>
    </main>
  )
}

export default SavedVerdict
