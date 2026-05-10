import { useState, type FormEvent } from 'react'
import { nanoid } from 'nanoid'
import { useNavigate } from 'react-router-dom'
import { useAiSession } from '../../../ai'
import Button from '../../../components/ui/Button'
import { buildVerdictPath } from '../../../routes/paths'
import PromptTextarea from './PromptTextarea'

const SESSION_CODE_LENGTH = 6

export interface VerdictNavigationState {
  prompt: string
}

function PromptForm() {
  const { providerId, apiKey } = useAiSession()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')

  const trimmedPrompt = prompt.trim()
  const isValid = providerId !== null && apiKey.trim().length > 0 && trimmedPrompt.length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!isValid) return
    const sessionCode = nanoid(SESSION_CODE_LENGTH)
    const navState: VerdictNavigationState = { prompt: trimmedPrompt }
    void navigate(buildVerdictPath(sessionCode), { state: navState })
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Geração de especificação"
      className="flex flex-col gap-6 rounded-md border border-border bg-surface p-6"
    >
      <PromptTextarea value={prompt} onChange={setPrompt} />
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-text-muted">
          {!isValid && providerId === null
            ? 'Selecione um provedor para continuar.'
            : !isValid && apiKey.trim().length === 0
              ? 'Informe a chave de API do provedor.'
              : !isValid && trimmedPrompt.length === 0
                ? 'Descreva o sistema que você quer.'
                : 'Tudo pronto. Sua chave nunca passa pelo nosso backend.'}
        </p>
        <Button type="submit" size="lg" disabled={!isValid}>
          Gerar especificação
        </Button>
      </div>
    </form>
  )
}

export default PromptForm
