import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '../../../routes/paths'

function HistoryEmptyState() {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-border px-6 py-8 text-text-secondary">
      <p className="text-sm">
        Faça{' '}
        <Link
          to={ROUTE_PATHS.login}
          className="text-accent transition-colors duration-fast hover:text-accent-hover"
        >
          login
        </Link>{' '}
        para salvar e rever suas especificações anteriores.
      </p>
      <p className="text-xs text-text-muted">
        Sem cadastro, cada especificação fica disponível apenas via o link com o código.
      </p>
    </div>
  )
}

export default HistoryEmptyState
