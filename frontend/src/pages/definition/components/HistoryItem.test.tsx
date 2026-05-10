import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Specification } from '../../../api'
import HistoryItem from './HistoryItem'

const spec: Specification = {
  id: 'id-1',
  sessionCode: 'aB3_-x',
  prompt: 'um app de chat para times pequenos',
  response: '## Visão Geral\n...',
  userId: 'u-1',
  createdAt: '2026-01-15T14:30:00Z',
}

describe('HistoryItem', () => {
  it('renders a link to /verdict/:sessionCode', () => {
    render(
      <MemoryRouter>
        <HistoryItem specification={spec} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link')).toHaveAttribute('href', '/verdict/aB3_-x')
  })

  it('shows the truncated prompt summary', () => {
    render(
      <MemoryRouter>
        <HistoryItem specification={spec} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/um app de chat para times pequenos/i)).toBeInTheDocument()
  })

  it('shows the sessionCode and a machine-readable date', () => {
    render(
      <MemoryRouter>
        <HistoryItem specification={spec} />
      </MemoryRouter>,
    )
    expect(screen.getByText('aB3_-x')).toBeInTheDocument()
    const time = screen.getByText(/2026/)
    expect(time.tagName).toBe('TIME')
    expect(time).toHaveAttribute('datetime', spec.createdAt)
  })
})
