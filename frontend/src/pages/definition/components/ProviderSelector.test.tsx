import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AiSessionProvider from '../../../ai/AiSessionProvider'
import ProviderSelector from './ProviderSelector'

function renderInProvider() {
  return render(
    <AiSessionProvider>
      <ProviderSelector />
    </AiSessionProvider>,
  )
}

describe('ProviderSelector', () => {
  it('renders a labeled select with all three providers', () => {
    renderInProvider()
    const select = screen.getByLabelText(/provedor de ia/i)
    expect(select).toBeInTheDocument()
    expect(select).toHaveDisplayValue('Selecione um provedor')
    // Options
    expect(screen.getByRole('option', { name: 'OpenAI' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Anthropic' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Google Gemini' })).toBeInTheDocument()
  })

  it('updates the session context when the user picks a provider', () => {
    renderInProvider()
    const select = screen.getByLabelText<HTMLSelectElement>(/provedor de ia/i)
    fireEvent.change(select, { target: { value: 'anthropic' } })
    expect(select.value).toBe('anthropic')
    // The avatar initial reflects the picked provider.
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('shows the provider avatar once a selection is made', () => {
    renderInProvider()
    const select = screen.getByLabelText<HTMLSelectElement>(/provedor de ia/i)
    // Before selection: no avatar letter
    expect(screen.queryByText('O')).toBeNull()
    fireEvent.change(select, { target: { value: 'openai' } })
    expect(screen.getByText('O')).toBeInTheDocument()
  })
})
