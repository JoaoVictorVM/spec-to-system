import type { Specification } from '../../../api'
import Button from '../../../components/ui/Button'
import HistoryItem from './HistoryItem'

interface HistoryListProps {
  items: Specification[]
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}

function HistoryList({ items, hasMore, loadingMore, onLoadMore }: HistoryListProps) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-8 text-sm text-text-muted">
        Nenhuma especificação ainda. Crie sua primeira acima.
      </p>
    )
  }

  return (
    <div>
      <ul aria-label="Especificações anteriores" className="divide-y divide-border">
        {items.map((spec) => (
          <HistoryItem key={spec.id} specification={spec} />
        ))}
      </ul>
      {hasMore && (
        <div className="px-4 py-4">
          <Button variant="secondary" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Carregando…' : 'Carregar mais'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default HistoryList
