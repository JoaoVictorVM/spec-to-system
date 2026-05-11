import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PasswordField from './PasswordField'

describe('PasswordField', () => {
  it('renders a labeled password input by default', () => {
    render(<PasswordField value="" onChange={() => undefined} />)
    const input = screen.getByLabelText<HTMLInputElement>('Senha')
    expect(input.type).toBe('password')
  })

  it('toggles visibility on button click', () => {
    render(<PasswordField value="abc" onChange={() => undefined} />)
    const input = screen.getByLabelText<HTMLInputElement>('Senha')
    fireEvent.click(screen.getByRole('button', { name: /mostrar senha/i }))
    expect(input.type).toBe('text')
    fireEvent.click(screen.getByRole('button', { name: /ocultar senha/i }))
    expect(input.type).toBe('password')
  })

  it('defaults autoComplete to current-password (login flow)', () => {
    render(<PasswordField value="" onChange={() => undefined} />)
    expect(screen.getByLabelText('Senha').getAttribute('autocomplete')).toBe('current-password')
  })

  it('uses autocomplete="new-password" when in register mode', () => {
    render(<PasswordField value="" onChange={() => undefined} autoComplete="new-password" />)
    expect(screen.getByLabelText('Senha').getAttribute('autocomplete')).toBe('new-password')
  })

  it('renders a hint with aria-describedby association', () => {
    render(<PasswordField value="" onChange={() => undefined} hint="pelo menos 8 chars" />)
    const input = screen.getByLabelText('Senha')
    const hintId = input.getAttribute('aria-describedby')
    expect(hintId).not.toBeNull()
    expect(screen.getByText(/pelo menos 8 chars/i)).toHaveAttribute('id', hintId)
  })
})
