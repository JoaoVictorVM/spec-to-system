import { SYSTEM_PROMPT } from './systemPrompt'
import { StreamError, type StreamAdapter } from './types'

const MAX_TOKENS = 4096

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

export const anthropicAdapter: StreamAdapter = async function* anthropicAdapter(request) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({
    apiKey: request.apiKey,
    // PRD §1: API key fica no browser, chamada direta sem proxy.
    dangerouslyAllowBrowser: true,
  })

  try {
    const stream = client.messages.stream(
      {
        model: request.model,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: request.prompt }],
      },
      { signal: request.signal },
    )

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
  } catch (error) {
    throw toStreamError(error)
  }
}
