import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import NotFoundVerdict from './NotFoundVerdict'

describe('NotFoundVerdict', () => {
  it('renders a 404 heading and shows the sessionCode in the message', () => {
    render(
      <MemoryRouter>
        <NotFoundVerdict sessionCode="abc123" />
      </MemoryRouter>,
    )
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: /especificação não encontrada/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('abc123')).toBeInTheDocument()
  })

  it('exposes a link to /definition', () => {
    render(
      <MemoryRouter>
        <NotFoundVerdict sessionCode="abc123" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /criar nova especificação/i })).toHaveAttribute(
      'href',
      '/definition',
    )
  })
})
