import LinkButton from '../../../components/ui/LinkButton'
import { ROUTE_PATHS } from '../../../routes/paths'

interface VerdictHeaderProps {
  sessionCode: string
}

function VerdictHeader({ sessionCode }: VerdictHeaderProps) {
  return (
    <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          Especificação
        </span>
        <h1 className="font-mono text-xl font-semibold text-text-primary">{sessionCode}</h1>
      </div>
      <LinkButton to={ROUTE_PATHS.definition} variant="secondary">
        Nova especificação
      </LinkButton>
    </header>
  )
}

export default VerdictHeader
