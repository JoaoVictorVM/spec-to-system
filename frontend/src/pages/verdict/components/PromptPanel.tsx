interface PromptPanelProps {
  prompt: string
}

function PromptPanel({ prompt }: PromptPanelProps) {
  return (
    <section aria-label="Prompt original" className="rounded-md border border-border bg-surface">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Prompt
        </h2>
      </header>
      <p className="whitespace-pre-wrap px-4 py-4 text-sm leading-relaxed text-text-secondary">
        {prompt}
      </p>
    </section>
  )
}

export default PromptPanel
