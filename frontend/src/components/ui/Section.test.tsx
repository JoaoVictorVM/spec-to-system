import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Section from './Section'

describe('Section', () => {
  it('renders children inside a <section>', () => {
    render(
      <Section>
        <p>body</p>
      </Section>,
    )
    expect(screen.getByText('body')).toBeInTheDocument()
  })

  it('renders eyebrow, heading and lead when provided', () => {
    render(
      <Section eyebrow="Como funciona" heading="Três passos" lead="Sem fricção.">
        <p>body</p>
      </Section>,
    )
    expect(screen.getByText('Como funciona')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Três passos' })).toBeInTheDocument()
    expect(screen.getByText('Sem fricção.')).toBeInTheDocument()
  })

  it('omits the header block when no eyebrow/heading/lead is given', () => {
    render(
      <Section>
        <p>only body</p>
      </Section>,
    )
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
  })
})
