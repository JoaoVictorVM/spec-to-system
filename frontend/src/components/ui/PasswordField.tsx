import { useId, useState, type InputHTMLAttributes } from 'react'

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> & {
  label?: string
  hint?: string
  /** Use 'new-password' on register, 'current-password' on login. */
  autoComplete?: 'current-password' | 'new-password'
}

function EyeIcon({ open }: { open: boolean }) {
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

function PasswordField({
  label = 'Senha',
  hint,
  autoComplete = 'current-password',
  className = '',
  ...rest
}: PasswordFieldProps) {
  const fieldId = useId()
  const hintId = `${fieldId}-hint`
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={fieldId}
        className="text-xs font-medium uppercase tracking-wide text-text-muted"
      >
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 transition-colors duration-fast focus-within:border-accent">
        <input
          id={fieldId}
          type={revealed ? 'text' : 'password'}
          autoComplete={autoComplete}
          spellCheck={false}
          aria-describedby={hint !== undefined ? hintId : undefined}
          className={`flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => {
            setRevealed((v) => !v)
          }}
          aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={revealed}
          className="flex shrink-0 items-center text-text-muted transition-colors duration-fast hover:text-text-primary"
        >
          <EyeIcon open={revealed} />
        </button>
      </div>
      {hint !== undefined && (
        <p id={hintId} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

export default PasswordField
