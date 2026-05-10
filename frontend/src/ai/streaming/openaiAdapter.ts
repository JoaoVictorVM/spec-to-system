import { SYSTEM_PROMPT } from './systemPrompt'
import { StreamError, type StreamAdapter } from './types'

/**
 * Maps OpenAI / network errors to our canonical StreamError. The OpenAI SDK
 * exposes status on its APIError type via `.status`.
 */
function toStreamError(error: unknown): StreamError {
  if (error instanceof StreamError) return error
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new StreamError('aborted', 'Stream aborted by the user', error)
  }
  const status = (error as { status?: unknown }).status
  if (status === 401 || status === 403) {
    return new StreamError('invalid-key', 'Chave de API rejeitada pelo provedor', error)
  }
  if (status === 429) {
    return new StreamError('rate-limit', 'Limite de requisições atingido', error)
  }
  if (typeof status === 'number') {
    return new StreamError('provider-error', `Erro do provedor (status ${String(status)})`, error)
  }
  if (error instanceof TypeError) {
    return new StreamError('network', 'Falha de conexão com o provedor', error)
  }
  return new StreamError('unknown', 'Erro inesperado durante o streaming', error)
}

export const openaiAdapter: StreamAdapter = async function* openaiAdapter(request) {
  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({
    apiKey: request.apiKey,
    // PRD §1: the user provides their own key and the call is made directly
    // from the browser, never through our backend. That's the design.
    dangerouslyAllowBrowser: true,
  })

  let stream
  try {
    stream = await client.chat.completions.create(
      {
        model: request.model,
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: request.prompt },
        ],
      },
      { signal: request.signal },
    )
  } catch (error) {
    throw toStreamError(error)
  }

  try {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (typeof delta === 'string' && delta.length > 0) {
        yield delta
      }
    }
  } catch (error) {
    throw toStreamError(error)
  }
}
