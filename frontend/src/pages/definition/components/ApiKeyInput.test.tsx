import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AiSessionProvider from '../../../ai/AiSessionProvider'
import ApiKeyInput from './ApiKeyInput'

function renderInProvider() {
  return render(
    <AiSessionProvider>
      <ApiKeyInput />
    </AiSessionProvider>,
  )
}

describe('ApiKeyInput', () => {
  it('renders a labeled input with type=password by default', () => {
    renderInProvider()
    const input = screen.getByLabelText<HTMLInputElement>(/chave de api/i)
    expect(input.type).toBe('password')
  })

  it('toggles between password and text via the show/hide button', () => {
    renderInProvider()
    const input = screen.getByLabelText<HTMLInputElement>(/chave de api/i)
    const toggle = screen.getByRole('button', { name: /mostrar chave/i })

    fireEvent.click(toggle)
    expect(input.type).toBe('text')
    expect(screen.getByRole('button', { name: /ocultar chave/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /ocultar chave/i }))
    expect(input.type).toBe('password')
  })

  it('updates the session context when the user types', () => {
    renderInProvider()
    const input = screen.getByLabelText<HTMLInputElement>(/chave de api/i)
    fireEvent.change(input, { target: { value: 'sk-test-1234' } })
    expect(input.value).toBe('sk-test-1234')
  })

  it('shows a privacy hint reminding the key never leaves the browser', () => {
    renderInProvider()
    expect(screen.getByText(/nunca é enviada ao backend/i)).toBeInTheDocument()
  })

  it('disables autocomplete and spellcheck on the input', () => {
    renderInProvider()
    const input = screen.getByLabelText<HTMLInputElement>(/chave de api/i)
    expect(input.getAttribute('autocomplete')).toBe('off')
    expect(input.getAttribute('spellcheck')).toBe('false')
  })
})
