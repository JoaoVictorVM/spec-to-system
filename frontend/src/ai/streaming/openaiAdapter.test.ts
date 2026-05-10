import { afterEach, describe, expect, it, vi } from 'vitest'
import { StreamError } from './types'

// Build a fake stream from an array of chunks (synchronously yielded).
function makeFakeStream(deltas: Array<string | null>): AsyncIterable<{
  choices: Array<{ delta: { content: string | null } }>
}> {
  let index = 0
  return {
    [Symbol.asyncIterator]() {
      return {
        next: async () => {
          if (index >= deltas.length) return Promise.resolve({ value: undefined, done: true })
          const value = { choices: [{ delta: { content: deltas[index] ?? null } }] }
          index += 1
          return Promise.resolve({ value, done: false })
        },
      }
    },
  } as never
}

const createMock = vi.fn()
const constructorSpy = vi.fn()

vi.mock('openai', () => {
  return {
    default: class FakeOpenAI {
      chat: { completions: { create: typeof createMock } }
      constructor(opts: unknown) {
        constructorSpy(opts)
        this.chat = { completions: { create: createMock } }
      }
    },
  }
})

afterEach(() => {
  createMock.mockReset()
  constructorSpy.mockReset()
})

async function collect(iterable: AsyncIterable<string>): Promise<string[]> {
  const out: string[] = []
  for await (const chunk of iterable) out.push(chunk)
  return out
}

describe('openaiAdapter', () => {
  it('passes apiKey + dangerouslyAllowBrowser to the SDK', async () => {
    createMock.mockResolvedValue(makeFakeStream([]))
    const { openaiAdapter } = await import('./openaiAdapter')

    await collect(openaiAdapter({ apiKey: 'sk-test', prompt: 'p', model: 'gpt-4o' }))

    expect(constructorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'sk-test',
        dangerouslyAllowBrowser: true,
      }),
    )
  })

  it('forwards the system prompt + user prompt and the model + signal', async () => {
    createMock.mockResolvedValue(makeFakeStream([]))
    const { openaiAdapter } = await import('./openaiAdapter')
    const controller = new AbortController()

    await collect(
      openaiAdapter({
        apiKey: 'sk-test',
        prompt: 'um chat app',
        model: 'gpt-4o',
        signal: controller.signal,
      }),
    )

    const [body, options] = createMock.mock.calls[0] as [
      { model: string; messages: Array<{ role: string; content: string }>; stream: boolean },
      { signal: AbortSignal },
    ]
    expect(body.model).toBe('gpt-4o')
    expect(body.stream).toBe(true)
    expect(body.messages[0]?.role).toBe('system')
    expect(body.messages[1]).toEqual({ role: 'user', content: 'um chat app' })
    expect(options.signal).toBe(controller.signal)
  })

  it('yields only non-empty content deltas', async () => {
    createMock.mockResolvedValue(makeFakeStream(['Hello', null, ' world', '']))
    const { openaiAdapter } = await import('./openaiAdapter')

    const chunks = await collect(openaiAdapter({ apiKey: 'sk', prompt: 'p', model: 'gpt-4o' }))
    expect(chunks).toEqual(['Hello', ' world'])
  })

  it('translates 401 from the SDK into StreamError("invalid-key")', async () => {
    const err: { status: number } & Error = Object.assign(new Error('Unauthorized'), {
      status: 401,
    })
    createMock.mockRejectedValue(err)
    const { openaiAdapter } = await import('./openaiAdapter')

    await expect(
      collect(openaiAdapter({ apiKey: 'bad', prompt: 'p', model: 'gpt-4o' })),
    ).rejects.toMatchObject({
      name: 'StreamError',
      kind: 'invalid-key',
    })
  })

  it('translates 429 into StreamError("rate-limit")', async () => {
    const err: { status: number } & Error = Object.assign(new Error('Too Many Requests'), {
      status: 429,
    })
    createMock.mockRejectedValue(err)
    const { openaiAdapter } = await import('./openaiAdapter')

    await expect(
      collect(openaiAdapter({ apiKey: 'sk', prompt: 'p', model: 'gpt-4o' })),
    ).rejects.toMatchObject({ kind: 'rate-limit' })
  })

  it('translates AbortError into StreamError("aborted")', async () => {
    createMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'))
    const { openaiAdapter } = await import('./openaiAdapter')

    await expect(
      collect(openaiAdapter({ apiKey: 'sk', prompt: 'p', model: 'gpt-4o' })),
    ).rejects.toMatchObject({ kind: 'aborted' })
  })

  it('translates a network TypeError into StreamError("network")', async () => {
    createMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const { openaiAdapter } = await import('./openaiAdapter')

    await expect(
      collect(openaiAdapter({ apiKey: 'sk', prompt: 'p', model: 'gpt-4o' })),
    ).rejects.toBeInstanceOf(StreamError)
  })
})
