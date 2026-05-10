import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import PromptTextarea, { PROMPT_MAX_LENGTH } from './PromptTextarea'

function ControlledHarness({
  initial = '',
  onChange,
}: {
  initial?: string
  onChange?: (next: string) => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <PromptTextarea
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    />
  )
}

describe('PromptTextarea', () => {
  it('renders a labeled textarea', () => {
    render(<ControlledHarness />)
    expect(screen.getByLabelText(/descreva seu sistema/i)).toBeInTheDocument()
  })

  it('forwards typed input to the parent via onChange', () => {
    const onChange = vi.fn()
    render(<ControlledHarness onChange={onChange} />)
    const textarea = screen.getByLabelText(/descreva seu sistema/i)
    fireEvent.change(textarea, { target: { value: 'meu app' } })
    expect(onChange).toHaveBeenCalledWith('meu app')
  })

  it('caps the input at PROMPT_MAX_LENGTH via the maxLength attribute', () => {
    render(<ControlledHarness />)
    const textarea = screen.getByLabelText<HTMLTextAreaElement>(/descreva seu sistema/i)
    expect(textarea.maxLength).toBe(PROMPT_MAX_LENGTH)
  })

  it('updates the character counter (debounced)', async () => {
    render(<ControlledHarness />)
    const textarea = screen.getByLabelText(/descreva seu sistema/i)

    // Initial counter
    expect(screen.getByText(`0 / ${String(PROMPT_MAX_LENGTH)}`)).toBeInTheDocument()

    fireEvent.change(textarea, { target: { value: 'abcde' } })

    // Debounced — counter eventually reflects "5 / 10000"
    await waitFor(() => {
      expect(screen.getByText(`5 / ${String(PROMPT_MAX_LENGTH)}`)).toBeInTheDocument()
    })
  })
})
