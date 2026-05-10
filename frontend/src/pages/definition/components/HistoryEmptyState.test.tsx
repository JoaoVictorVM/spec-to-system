import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import HistoryEmptyState from './HistoryEmptyState'

describe('HistoryEmptyState', () => {
  it('renders the PRD-mandated CTA pointing to /login', () => {
    render(
      <MemoryRouter>
        <HistoryEmptyState />
      </MemoryRouter>,
    )
    expect(screen.getByText(/faça/i)).toBeInTheDocument()
    expect(screen.getByText(/salvar e rever/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login')
  })
})
