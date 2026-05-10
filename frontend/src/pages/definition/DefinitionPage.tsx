import ConfigurationCard from './components/ConfigurationCard'
import HistoryPanel from './components/HistoryPanel'
import PromptForm from './components/PromptForm'

function DefinitionPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-screen-lg flex-col gap-6 px-6 py-10 md:py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tracked text-text-primary md:text-3xl">
            Nova especificação
          </h1>
          <p className="text-sm text-text-secondary">
            Configure seu provedor de IA, descreva o sistema e gere uma especificação completa.
          </p>
        </header>

        <ConfigurationCard />
        <PromptForm />
        <HistoryPanel />
      </div>
    </main>
  )
}

export default DefinitionPage
