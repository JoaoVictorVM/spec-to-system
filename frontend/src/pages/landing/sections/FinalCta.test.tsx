import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import FinalCta from './FinalCta'

function renderCta() {
  return render(
    <MemoryRouter>
      <FinalCta />
    </MemoryRouter>,
  )
}

describe('FinalCta', () => {
  it('renders the closing headline', () => {
    renderCta()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/pronto para definir/i)
  })

  it('reinforces privacy in the lead copy', () => {
    renderCta()
    expect(screen.getByText(/sua chave de api nunca é enviada/i)).toBeInTheDocument()
  })

  it('links the CTA to /definition', () => {
    renderCta()
    expect(screen.getByRole('link', { name: /começar agora/i })).toHaveAttribute(
      'href',
      '/definition',
    )
  })
})
