import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LinkButton from './LinkButton'

describe('LinkButton', () => {
  it('renders an anchor with the given destination', () => {
    render(
      <MemoryRouter>
        <LinkButton to="/definition">Começar</LinkButton>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Começar' })).toHaveAttribute('href', '/definition')
  })

  it('applies the secondary variant when requested', () => {
    render(
      <MemoryRouter>
        <LinkButton to="/x" variant="secondary">
          x
        </LinkButton>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link').className).toContain('surface-glass')
  })
})
