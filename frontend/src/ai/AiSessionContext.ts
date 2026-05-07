import { createContext } from 'react'
import type { AiProviderId } from './types'

export interface AiSessionContextValue {
  /** Currently selected provider, or null when the user hasn't picked one. */
  providerId: AiProviderId | null
  /** Plain-text API key held in memory only — never persisted. */
  apiKey: string
  setProviderId: (id: AiProviderId | null) => void
  setApiKey: (key: string) => void
  clear: () => void
}

export const AiSessionContext = createContext<AiSessionContextValue | null>(null)
