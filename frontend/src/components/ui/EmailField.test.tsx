import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EmailField from './EmailField'

describe('EmailField', () => {
  it('renders a labeled input of type email', () => {
    render(<EmailField value="" onChange={() => undefined} />)
    const input = screen.getByLabelText<HTMLInputElement>(/email/i)
    expect(input.type).toBe('email')
  })

  it('forwards typed input via onChange', () => {
    const onChange = vi.fn()
    render(<EmailField value="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.c' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('renders the optional hint with an aria association', () => {
    render(<EmailField value="" onChange={() => undefined} hint="seu email pessoal" />)
    const input = screen.getByLabelText(/email/i)
    const hintId = input.getAttribute('aria-describedby')
    expect(hintId).not.toBeNull()
    expect(screen.getByText(/seu email pessoal/i)).toHaveAttribute('id', hintId)
  })

  it('uses autocomplete="email" and disables spellcheck', () => {
    render(<EmailField value="" onChange={() => undefined} />)
    const input = screen.getByLabelText(/email/i)
    expect(input.getAttribute('autocomplete')).toBe('email')
    expect(input.getAttribute('spellcheck')).toBe('false')
  })
})
