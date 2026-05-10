import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Specification } from '../../../api'
import HistoryList from './HistoryList'

function makeSpec(seed: string): Specification {
  return {
    id: `id-${seed}`,
    sessionCode: seed,
    prompt: `prompt for ${seed}`,
    response: 'r',
    userId: 'u-1',
    createdAt: '2026-01-01T00:00:00Z',
  }
}

function renderList(props: Partial<React.ComponentProps<typeof HistoryList>>) {
  return render(
    <MemoryRouter>
      <HistoryList
        items={[]}
        hasMore={false}
        loadingMore={false}
        onLoadMore={() => undefined}
        {...props}
      />
    </MemoryRouter>,
  )
}

describe('HistoryList', () => {
  it('shows an empty hint when there are no items', () => {
    renderList({ items: [] })
    expect(screen.getByText(/nenhuma especificação ainda/i)).toBeInTheDocument()
  })

  it('renders one item per spec inside an aria-labeled list', () => {
    renderList({ items: [makeSpec('aaa'), makeSpec('bbb')] })
    expect(screen.getByRole('list', { name: /especificações anteriores/i })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('hides the load-more button when there is no next page', () => {
    renderList({ items: [makeSpec('a')], hasMore: false })
    expect(screen.queryByRole('button', { name: /carregar mais/i })).toBeNull()
  })

  it('shows the load-more button when there is a next page and calls onLoadMore', () => {
    const onLoadMore = vi.fn()
    renderList({ items: [makeSpec('a')], hasMore: true, onLoadMore })

    fireEvent.click(screen.getByRole('button', { name: /carregar mais/i }))
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('disables the load-more button while loading more', () => {
    renderList({ items: [makeSpec('a')], hasMore: true, loadingMore: true })
    expect(screen.getByRole('button', { name: /carregando/i })).toBeDisabled()
  })
})
