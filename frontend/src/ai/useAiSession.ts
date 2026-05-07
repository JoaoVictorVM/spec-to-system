import { useContext } from 'react'
import { AiSessionContext, type AiSessionContextValue } from './AiSessionContext'

export function useAiSession(): AiSessionContextValue {
  const ctx = useContext(AiSessionContext)
  if (!ctx) {
    throw new Error('useAiSession must be used within an <AiSessionProvider>')
  }
  return ctx
}
