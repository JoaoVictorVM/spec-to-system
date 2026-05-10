import { afterEach, describe, expect, it, vi } from 'vitest'

interface AnthropicEvent {
  type: 'content_block_delta' | 'message_stop'
  delta?: { type: 'text_delta'; text: string }
}

function makeFakeStream(events: AnthropicEvent[]): AsyncIterable<AnthropicEvent> {
  let index = 0
  return {
    [Symbol.asyncIterator]() {
      return {
        next: async () => {
          if (index >= events.length) return Promise.resolve({ value: undefined, done: true })
          const value = events[index]
          index += 1
          return Promise.resolve({ value: value as AnthropicEvent, done: false })
        },
      }
    },
  }
}

const streamMock = vi.fn()
const constructorSpy = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class FakeAnthropic {
      messages: { stream: typeof streamMock }
      constructor(opts: unknown) {
        constructorSpy(opts)
        this.messages = { stream: streamMock }
      }
    },
  }
})

afterEach(() => {
  streamMock.mockReset()
  constructorSpy.mockReset()
})

async function collect(iterable: AsyncIterable<string>): Promise<string[]> {
  const out: string[] = []
  for await (const chunk of iterable) out.push(chunk)
  return out
}

describe('anthropicAdapter', () => {
  it('passes apiKey + dangerouslyAllowBrowser to the SDK', async () => {
    streamMock.mockReturnValue(makeFakeStream([]))
    const { anthropicAdapter } = await import('./anthropicAdapter')

    await collect(
      anthropicAdapter({ apiKey: 'sk-x', prompt: 'p', model: 'claude-sonnet-4-20250514' }),
    )

    expect(constructorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'sk-x', dangerouslyAllowBrowser: true }),
    )
  })

  it('forwards system prompt, user message, model and signal', async () => {
    streamMock.mockReturnValue(makeFakeStream([]))
    const controller = new AbortController()
    const { anthropicAdapter } = await import('./anthropicAdapter')

    await collect(
      anthropicAdapter({
        apiKey: 'sk',
        prompt: 'meu app',
        model: 'claude-sonnet-4-20250514',
        signal: controller.signal,
      }),
    )

    const [body, options] = streamMock.mock.calls[0] as [
      {
        model: string
        system: string
        messages: Array<{ role: string; content: string }>
        max_tokens: number
      },
      { signal: AbortSignal },
    ]
    expect(body.model).toBe('claude-sonnet-4-20250514')
    expect(body.messages).toEqual([{ role: 'user', content: 'meu app' }])
    expect(body.max_tokens).toBeGreaterThan(0)
    expect(typeof body.system).toBe('string')
    expect(options.signal).toBe(controller.signal)
  })

  it('yields only text_delta payloads from content_block_delta events', async () => {
    streamMock.mockReturnValue(
      makeFakeStream([
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello ' } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'world' } },
        { type: 'message_stop' },
      ]),
    )
    const { anthropicAdapter } = await import('./anthropicAdapter')

    const chunks = await collect(
      anthropicAdapter({ apiKey: 'sk', prompt: 'p', model: 'claude-sonnet-4-20250514' }),
    )
    expect(chunks).toEqual(['Hello ', 'world'])
  })

  it('maps a 401 error into StreamError("invalid-key")', async () => {
    const err: { status: number } & Error = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    streamMock.mockImplementation(() => {
      throw err
    })
    const { anthropicAdapter } = await import('./anthropicAdapter')

    await expect(
      collect(anthropicAdapter({ apiKey: 'bad', prompt: 'p', model: 'claude-sonnet-4-20250514' })),
    ).rejects.toMatchObject({ kind: 'invalid-key' })
  })
})
