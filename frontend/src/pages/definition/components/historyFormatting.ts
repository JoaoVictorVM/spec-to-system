const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
})

const SUMMARY_MAX = 90

export function formatHistoryDate(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  return `${DATE_FORMATTER.format(date)} · ${TIME_FORMATTER.format(date)}`
}

export function summarizePrompt(prompt: string): string {
  const trimmed = prompt.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= SUMMARY_MAX) return trimmed
  return `${trimmed.slice(0, SUMMARY_MAX - 1).trimEnd()}…`
}
