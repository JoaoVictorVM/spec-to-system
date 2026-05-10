import { Link } from 'react-router-dom'
import type { StreamErrorKind } from '../../../ai/streaming'
import { ROUTE_PATHS } from '../../../routes/paths'

interface StreamingErrorPanelProps {
  kind: StreamErrorKind
  message: string
  /** Optional retry handler. When omitted, the action is hidden. */
  onRetry?: () => void
}

interface ErrorPresentation {
  title: string
  hint: string
}

function present(kind: StreamErrorKind, fallbackMessage: string): ErrorPresentation {
  switch (kind) {
    case 'invalid-key':
      return {
        title: 'Chave de API rejeitada',
        hint: 'Verifique a chave do provedor selecionado e tente novamente.',
      }
    case 'rate-limit':
      return {
        title: 'Limite de requisições atingido',
        hint: 'Seu provedor recusou a chamada por excesso de uso. Tente em alguns minutos.',
      }
    case 'network':
      return {
        title: 'Falha de conexão',
        hint: 'Não foi possível alcançar o provedor. Verifique sua rede e tente novamente.',
      }
    case 'aborted':
      return {
        title: 'Geração interrompida',
        hint: 'A geração foi cancelada antes de terminar.',
      }
    case 'provider-error':
      return {
        title: 'Erro do provedor',
        hint: fallbackMessage,
      }
    case 'unknown':
    default:
      return {
        title: 'Algo deu errado',
        hint: fallbackMessage,
      }
  }
}

function StreamingErrorPanel({ kind, message, onRetry }: StreamingErrorPanelProps) {
  const { title, hint } = present(kind, message)
  return (
    <section
      role="alert"
      aria-live="polite"
      className="rounded-md border border-error bg-surface px-4 py-4"
    >
      <h2 className="text-sm font-semibold text-error">{title}</h2>
      <p className="mt-1 text-sm text-text-secondary">{hint}</p>
      <div className="mt-4 flex items-center gap-3">
        {onRetry !== undefined && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-border bg-surface-raised px-4 py-2 text-sm text-text-primary transition-colors duration-fast hover:border-border-bright"
          >
            Tentar novamente
          </button>
        )}
        <Link
          to={ROUTE_PATHS.definition}
          className="text-sm text-accent transition-colors duration-fast hover:text-accent-hover"
        >
          Voltar ao formulário
        </Link>
      </div>
    </section>
  )
}

export default StreamingErrorPanel
