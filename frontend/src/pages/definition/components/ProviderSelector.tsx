import { useId } from 'react'
import { AI_PROVIDERS, findProvider, useAiSession, type AiProviderId } from '../../../ai'
import ProviderAvatar from './ProviderAvatar'

function ProviderSelector() {
  const fieldId = useId()
  const { providerId, setProviderId } = useAiSession()
  const selectedProvider = providerId !== null ? findProvider(providerId) : null

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    const value = event.target.value
    setProviderId(value === '' ? null : (value as AiProviderId))
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={fieldId}
        className="text-xs font-medium uppercase tracking-wide text-text-muted"
      >
        Provedor de IA
      </label>
      <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 transition-colors duration-fast focus-within:border-accent">
        {selectedProvider ? (
          <ProviderAvatar provider={selectedProvider} />
        ) : (
          <span
            aria-hidden="true"
            className="h-6 w-6 shrink-0 rounded-full border border-dashed border-border-bright"
          />
        )}
        <select
          id={fieldId}
          value={providerId ?? ''}
          onChange={handleChange}
          className="flex-1 cursor-pointer appearance-none bg-transparent text-base text-text-primary outline-none"
        >
          <option value="" disabled>
            Selecione um provedor
          </option>
          {AI_PROVIDERS.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-text-muted"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

export default ProviderSelector
