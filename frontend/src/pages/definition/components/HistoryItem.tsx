import { Link } from 'react-router-dom'
import type { Specification } from '../../../api'
import { buildVerdictPath } from '../../../routes/paths'
import { formatHistoryDate, summarizePrompt } from './historyFormatting'

interface HistoryItemProps {
  specification: Specification
}

function HistoryItem({ specification }: HistoryItemProps) {
  return (
    <li>
      <Link
        to={buildVerdictPath(specification.sessionCode)}
        className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 transition-colors duration-fast hover:bg-accent-soft focus-visible:bg-accent-soft focus-visible:outline-0"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm text-text-primary">
            {summarizePrompt(specification.prompt)}
          </span>
          <span className="font-mono text-xs text-text-muted">{specification.sessionCode}</span>
        </span>
        <time
          dateTime={specification.createdAt}
          className="shrink-0 font-mono text-xs text-text-muted"
        >
          {formatHistoryDate(specification.createdAt)}
        </time>
      </Link>
    </li>
  )
}

export default HistoryItem
