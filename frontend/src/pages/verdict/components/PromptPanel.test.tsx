import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PromptPanel from './PromptPanel'

describe('PromptPanel', () => {
  it('renders the original prompt verbatim inside a labeled region', () => {
    render(<PromptPanel prompt="um app de chat para times pequenos" />)
    expect(screen.getByRole('region', { name: /prompt original/i })).toBeInTheDocument()
    expect(screen.getByText('um app de chat para times pequenos')).toBeInTheDocument()
  })

  it('preserves whitespace via whitespace-pre-wrap class', () => {
    render(<PromptPanel prompt={'linha 1\nlinha 2'} />)
    const text = screen.getByText(/linha 1/)
    expect(text.className).toContain('whitespace-pre-wrap')
  })
})
