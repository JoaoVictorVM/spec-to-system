import { SYSTEM_PROMPT } from './systemPrompt'
import { StreamError, type StreamAdapter } from './types'

function toStreamError(error: unknown): StreamError {
  if (error instanceof StreamError) return error
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new StreamError('aborted', 'Stream aborted by the user', error)
  }
  const message = error instanceof Error ? error.message : String(error)
  // Gemini does not expose HTTP status nicely — pattern-match on the message.
  if (/api[_ ]?key|api key/i.test(message) || /unauthen|forbidden/i.test(message)) {
    return new StreamError('invalid-key', 'Chave de API rejeitada pelo provedor', error)
  }
  if (/quota|rate.?limit|resource.?exhausted/i.test(message)) {
    return new StreamError('rate-limit', 'Limite de requisições atingido', error)
  }
  if (error instanceof TypeError || /fetch/i.test(message)) {
    return new StreamError('network', 'Falha de conexão com o provedor', error)
  }
  return new StreamError('unknown', 'Erro inesperado durante o streaming', error)
}

export const geminiAdapter: StreamAdapter = async function* geminiAdapter(request) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const client = new GoogleGenerativeAI(request.apiKey)
  const model = client.getGenerativeModel({
    model: request.model,
    systemInstruction: SYSTEM_PROMPT,
  })

  try {
    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
    })

    for await (const chunk of result.stream) {
      // Cancellation is checked between chunks — Gemini's SDK doesn't yet
      // accept an AbortSignal directly.
      if (request.signal?.aborted === true) {
        throw new DOMException('Aborted', 'AbortError')
      }
      const text = chunk.text()
      if (typeof text === 'string' && text.length > 0) {
        yield text
      }
    }
  } catch (error) {
    throw toStreamError(error)
  }
}
