import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { Specification } from '../../api'
import SavedVerdict from './SavedVerdict'

const spec: Specification = {
  id: 'id-1',
  sessionCode: 'aB3_-x',
  prompt: 'um app de chat',
  response: '## Visão Geral\n\nUse Next.js + Postgres.',
  userId: 'u-1',
  createdAt: '2026-01-01T00:00:00Z',
}

function renderSaved() {
  return render(
    <MemoryRouter>
      <SavedVerdict specification={spec} />
    </MemoryRouter>,
  )
}

describe('SavedVerdict', () => {
  it('renders the session code header, prompt panel and response markdown', () => {
    renderSaved()
    expect(screen.getByRole('heading', { level: 1, name: 'aB3_-x' })).toBeInTheDocument()
    expect(screen.getByText('um app de chat')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /visão geral/i })).toBeInTheDocument()
  })

  it('does not render the streaming cursor (response is final)', () => {
    renderSaved()
    expect(screen.queryByTestId('streaming-cursor')).toBeNull()
  })

  it('marks the spec region as not busy', () => {
    renderSaved()
    const region = screen.getByRole('region', { name: /especificação gerada/i })
    expect(region.getAttribute('aria-busy')).not.toBe('true')
  })
})
