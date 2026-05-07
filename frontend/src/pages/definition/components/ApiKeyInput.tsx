import { useId, useState } from 'react'
import { useAiSession } from '../../../ai'

function EyeIcon({ open }: { open: boolean }) {
  // Two paths so the toggle has a clear visual change between hide/show.
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 8s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" />
      <circle cx="8" cy="8" r="2" />
      {!open && <path d="M3 3l10 10" stroke="currentColor" />}
    </svg>
  )
}

function ApiKeyInput() {
  const fieldId = useId()
  const { apiKey, setApiKey } = useAiSession()
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={fieldId}
        className="text-xs font-medium uppercase tracking-wide text-text-muted"
      >
        Chave de API
      </label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 transition-colors duration-fast focus-within:border-accent">
        <input
          id={fieldId}
          type={revealed ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value)
          }}
          placeholder="sk-..."
          autoComplete="off"
          spellCheck={false}
          aria-describedby={`${fieldId}-hint`}
          className="flex-1 bg-transparent font-mono text-sm text-text-primary outline-none placeholder:text-text-muted"
        />
        <button
          type="button"
          onClick={() => {
            setRevealed((v) => !v)
          }}
          aria-label={revealed ? 'Ocultar chave' : 'Mostrar chave'}
          aria-pressed={revealed}
          className="flex shrink-0 items-center text-text-muted transition-colors duration-fast hover:text-text-primary"
        >
          <EyeIcon open={revealed} />
        </button>
      </div>
      <p id={`${fieldId}-hint`} className="text-xs text-text-muted">
        Sua chave fica apenas no navegador durante esta sessão. Nunca é enviada ao backend.
      </p>
    </div>
  )
}

export default ApiKeyInput
