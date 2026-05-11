import { useId, type InputHTMLAttributes } from 'react'

type EmailFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> & {
  label?: string
  hint?: string
}

function EmailField({ label = 'Email', hint, className = '', ...rest }: EmailFieldProps) {
  const fieldId = useId()
  const hintId = `${fieldId}-hint`
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={fieldId}
        className="text-xs font-medium uppercase tracking-wide text-text-muted"
      >
        {label}
      </label>
      <input
        id={fieldId}
        type="email"
        autoComplete="email"
        spellCheck={false}
        aria-describedby={hint !== undefined ? hintId : undefined}
        className={`rounded-md border border-border bg-surface px-3 py-2 text-base text-text-primary outline-none transition-colors duration-fast placeholder:text-text-muted focus:border-accent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...rest}
      />
      {hint !== undefined && (
        <p id={hintId} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

export default EmailField
