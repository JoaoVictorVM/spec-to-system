import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import VerdictHeader from './VerdictHeader'

describe('VerdictHeader', () => {
  it('renders the session code as the page heading', () => {
    render(
      <MemoryRouter>
        <VerdictHeader sessionCode="aB3_-x" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'aB3_-x' })).toBeInTheDocument()
  })

  it('exposes the "Nova especificação" link to /definition', () => {
    render(
      <MemoryRouter>
        <VerdictHeader sessionCode="aB3_-x" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /nova especificação/i })).toHaveAttribute(
      'href',
      '/definition',
    )
  })
})
