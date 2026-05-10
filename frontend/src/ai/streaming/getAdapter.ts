import type { AiProviderId } from '../types'
import type { StreamAdapter, StreamAdapterRegistry } from './types'

/**
 * Lazy-loaded adapters. Each entry only pulls in its provider SDK on first
 * use, keeping the initial bundle small.
 */
export const adapterRegistry: StreamAdapterRegistry = {
  openai: async () => (await import('./openaiAdapter')).openaiAdapter,
  anthropic: async () => (await import('./anthropicAdapter')).anthropicAdapter,
  gemini: async () => (await import('./geminiAdapter')).geminiAdapter,
}

export async function getAdapter(providerId: AiProviderId): Promise<StreamAdapter> {
  return adapterRegistry[providerId]()
}
