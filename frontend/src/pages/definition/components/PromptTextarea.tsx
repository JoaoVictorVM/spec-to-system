import { useId } from 'react'
import { useDebounce } from '../../../hooks/useDebounce'

export const PROMPT_MAX_LENGTH = 10_000
const COUNTER_DEBOUNCE_MS = 150

interface PromptTextareaProps {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}

function PromptTextarea({ value, onChange, disabled = false }: PromptTextareaProps) {
  const fieldId = useId()
  // Debounce the value used for the counter so quick typing doesn't churn the
  // counter element on every keystroke (PRD §10).
  const debouncedValue = useDebounce(value, COUNTER_DEBOUNCE_MS)
  const counter = `${String(debouncedValue.length)} / ${String(PROMPT_MAX_LENGTH)}`
  const isOver = debouncedValue.length > PROMPT_MAX_LENGTH

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={fieldId}
          className="text-xs font-medium uppercase tracking-wide text-text-muted"
        >
          Descreva seu sistema
        </label>
        <span
          aria-live="polite"
          className={`font-mono text-xs ${isOver ? 'text-error' : 'text-text-muted'}`}
        >
          {counter}
        </span>
      </div>
      <textarea
        id={fieldId}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        disabled={disabled}
        rows={8}
        maxLength={PROMPT_MAX_LENGTH}
        placeholder="Ex.: um app de chat para times pequenos com canais públicos e privados, mensagens em tempo real, busca por mensagens antigas e integração com Slack."
        spellCheck
        className="block w-full resize-y rounded-md border border-border bg-surface px-3 py-3 text-base leading-relaxed text-text-primary outline-none transition-colors duration-fast placeholder:text-text-muted focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}

export default PromptTextarea
