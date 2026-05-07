import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HowItWorks from './HowItWorks'

describe('HowItWorks', () => {
  it('renders the section heading', () => {
    render(<HowItWorks />)
    expect(screen.getByRole('heading', { level: 2, name: /três passos/i })).toBeInTheDocument()
  })

  it('renders three numbered steps', () => {
    render(<HowItWorks />)
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
  })

  it('exposes an ordered list with three items', () => {
    render(<HowItWorks />)
    expect(screen.getByRole('list', { name: /passos do fluxo/i })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('mentions all three providers (OpenAI, Anthropic, Gemini)', () => {
    render(<HowItWorks />)
    expect(screen.getByText(/openai/i)).toBeInTheDocument()
    expect(screen.getByText(/anthropic/i)).toBeInTheDocument()
    expect(screen.getByText(/gemini/i)).toBeInTheDocument()
  })
})
