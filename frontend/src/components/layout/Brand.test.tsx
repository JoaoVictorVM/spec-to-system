import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Brand from './Brand'

describe('Brand', () => {
  it('renders the product name as a link to /', () => {
    render(
      <MemoryRouter>
        <Brand />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: /spec-to-system/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })
})
