export type AiProviderId = 'openai' | 'anthropic' | 'gemini'

export interface AiProvider {
  id: AiProviderId
  /** Human-friendly name shown in the UI. */
  label: string
  /** Default model used for streaming. */
  defaultModel: string
  /** Brand-tinted CSS variable name (without the leading `--`) for the avatar dot. */
  brandColorVar: string
  /** Single-letter avatar fallback. */
  initial: string
}

export const AI_PROVIDERS: readonly AiProvider[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    defaultModel: 'gpt-4o',
    brandColorVar: 'color-success',
    initial: 'O',
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    defaultModel: 'claude-sonnet-4-20250514',
    brandColorVar: 'color-pink',
    initial: 'A',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    defaultModel: 'gemini-1.5-pro',
    brandColorVar: 'color-cyan',
    initial: 'G',
  },
] as const

export function findProvider(id: AiProviderId): AiProvider {
  const provider = AI_PROVIDERS.find((p) => p.id === id)
  if (!provider) {
    throw new Error(`Unknown AI provider: ${id}`)
  }
  return provider
}
