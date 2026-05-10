import { useAuth } from '../../../auth'
import HistoryEmptyState from './HistoryEmptyState'
import HistoryList from './HistoryList'
import { useHistoryList } from './useHistoryList'

function HistoryPanel() {
  const { state: authState } = useAuth()
  const isAuthenticated = authState.status === 'authenticated'
  const history = useHistoryList(isAuthenticated)

  return (
    <section
      aria-label="Histórico de especificações"
      className="rounded-md border border-border bg-surface"
    >
      <header className="flex items-baseline justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Histórico
        </h2>
        {isAuthenticated && history.status === 'ready' && (
          <span className="font-mono text-xs text-text-muted">
            {String(history.items.length)} {history.items.length === 1 ? 'item' : 'itens'}
          </span>
        )}
      </header>

      {authState.status === 'loading' ? (
        <p className="px-4 py-8 text-sm text-text-muted">Carregando sessão…</p>
      ) : authState.status === 'unauthenticated' ? (
        <div className="p-4">
          <HistoryEmptyState />
        </div>
      ) : history.status === 'loading' ? (
        <p className="px-4 py-8 text-sm text-text-muted">Carregando histórico…</p>
      ) : history.status === 'error' ? (
        <p className="px-4 py-8 text-sm text-error">
          Não foi possível carregar o histórico. Tente novamente em alguns instantes.
        </p>
      ) : (
        <HistoryList
          items={history.items}
          hasMore={history.nextCursor !== null}
          loadingMore={history.status === 'loading-more'}
          onLoadMore={history.loadMore}
        />
      )}
    </section>
  )
}

export default HistoryPanel
