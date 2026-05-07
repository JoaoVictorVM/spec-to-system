import ApiKeyInput from './ApiKeyInput'
import ProviderSelector from './ProviderSelector'

function ConfigurationCard() {
  return (
    <section
      aria-label="Configuração de IA"
      className="rounded-md border border-border bg-surface p-6"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <ProviderSelector />
        </div>
        <div className="md:col-span-2">
          <ApiKeyInput />
        </div>
      </div>
    </section>
  )
}

export default ConfigurationCard
