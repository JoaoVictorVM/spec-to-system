import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AiSessionContext, type AiSessionContextValue } from './AiSessionContext'
import type { AiProviderId } from './types'

interface AiSessionProviderProps {
  children: ReactNode
}

/**
 * Holds the user's chosen AI provider and API key in memory only — never
 * persisted to localStorage, sessionStorage, cookies, or the backend. The
 * value is lost on refresh by design (PRD §1).
 */
function AiSessionProvider({ children }: AiSessionProviderProps) {
  const [providerId, setProviderIdState] = useState<AiProviderId | null>(null)
  const [apiKey, setApiKeyState] = useState<string>('')

  const setProviderId = useCallback((id: AiProviderId | null) => {
    setProviderIdState(id)
  }, [])

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key)
  }, [])

  const clear = useCallback(() => {
    setProviderIdState(null)
    setApiKeyState('')
  }, [])

  const value = useMemo<AiSessionContextValue>(
    () => ({ providerId, apiKey, setProviderId, setApiKey, clear }),
    [providerId, apiKey, setProviderId, setApiKey, clear],
  )

  return <AiSessionContext.Provider value={value}>{children}</AiSessionContext.Provider>
}

export default AiSessionProvider
