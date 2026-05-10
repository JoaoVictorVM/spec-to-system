import { useState, type ReactNode } from 'react'
import { vi } from 'vitest'
import { AiSessionContext, type AiSessionContextValue } from '../AiSessionContext'
import type { AiProviderId } from '../types'

interface AiSessionHarnessProps {
  initialProviderId?: AiProviderId | null
  initialApiKey?: string
  children: ReactNode
}

/**
 * Test harness that synchronously seeds the AiSession state before any
 * descendant renders — useful for components that read provider/apiKey on
 * first render.
 */
export function AiSessionHarness({
  initialProviderId = null,
  initialApiKey = '',
  children,
}: AiSessionHarnessProps) {
  const [providerId, setProviderId] = useState<AiProviderId | null>(initialProviderId)
  const [apiKey, setApiKey] = useState<string>(initialApiKey)

  const value: AiSessionContextValue = {
    providerId,
    apiKey,
    setProviderId,
    setApiKey,
    clear: vi.fn(() => {
      setProviderId(null)
      setApiKey('')
    }),
  }

  return <AiSessionContext.Provider value={value}>{children}</AiSessionContext.Provider>
}
