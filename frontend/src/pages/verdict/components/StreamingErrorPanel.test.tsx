import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import StreamingErrorPanel from './StreamingErrorPanel'

function renderPanel(props: Parameters<typeof StreamingErrorPanel>[0]) {
  return render(
    <MemoryRouter>
      <StreamingErrorPanel {...props} />
    </MemoryRouter>,
  )
}

describe('StreamingErrorPanel', () => {
  it('renders inside an alert role for screen readers', () => {
    renderPanel({ kind: 'unknown', message: 'whatever' })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows a friendly message for invalid-key', () => {
    renderPanel({ kind: 'invalid-key', message: 'rejected' })
    expect(screen.getByText(/chave de api rejeitada/i)).toBeInTheDocument()
  })

  it('shows a rate-limit hint', () => {
    renderPanel({ kind: 'rate-limit', message: 'too many' })
    expect(screen.getByText(/limite de requisições/i)).toBeInTheDocument()
  })

  it('shows a network-error hint', () => {
    renderPanel({ kind: 'network', message: 'no connection' })
    expect(screen.getByText(/falha de conexão/i)).toBeInTheDocument()
  })

  it('uses the raw message as the hint for provider-error', () => {
    renderPanel({ kind: 'provider-error', message: 'Provider returned 503' })
    expect(screen.getByText('Provider returned 503')).toBeInTheDocument()
  })

  it('always exposes a link back to /definition', () => {
    renderPanel({ kind: 'unknown', message: 'x' })
    expect(screen.getByRole('link', { name: /voltar ao formulário/i })).toHaveAttribute(
      'href',
      '/definition',
    )
  })

  it('hides the retry button when no onRetry is provided', () => {
    renderPanel({ kind: 'unknown', message: 'x' })
    expect(screen.queryByRole('button', { name: /tentar novamente/i })).toBeNull()
  })

  it('renders the retry button and calls onRetry when clicked', () => {
    const onRetry = vi.fn()
    renderPanel({ kind: 'network', message: 'x', onRetry })
    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
