import { afterEach, describe, expect, it, vi } from 'vitest'

function makeFakeStream(texts: string[]): AsyncIterable<{ text: () => string }> {
  let index = 0
  return {
    [Symbol.asyncIterator]() {
      return {
        next: async () => {
          if (index >= texts.length) return Promise.resolve({ value: undefined, done: true })
          const text = texts[index]
          index += 1
          return Promise.resolve({ value: { text: () => text ?? '' }, done: false })
        },
      }
    },
  }
}

const generateMock = vi.fn()
const getModelMock = vi.fn()
const constructorSpy = vi.fn()

vi.mock('@google/generative-ai', () => {
  class FakeGoogleGenerativeAI {
    constructor(apiKey: string) {
      constructorSpy(apiKey)
    }
    getGenerativeModel(opts: unknown) {
      getModelMock(opts)
      return { generateContentStream: generateMock }
    }
  }
  return { GoogleGenerativeAI: FakeGoogleGenerativeAI }
})

afterEach(() => {
  generateMock.mockReset()
  getModelMock.mockReset()
  constructorSpy.mockReset()
})

async function collect(iterable: AsyncIterable<string>): Promise<string[]> {
  const out: string[] = []
  for await (const chunk of iterable) out.push(chunk)
  return out
}

describe('geminiAdapter', () => {
  it('passes apiKey, model and systemInstruction to the SDK', async () => {
    generateMock.mockResolvedValue({ stream: makeFakeStream([]) })
    const { geminiAdapter } = await import('./geminiAdapter')

    await collect(geminiAdapter({ apiKey: 'k', prompt: 'p', model: 'gemini-1.5-pro' }))

    expect(constructorSpy).toHaveBeenCalledWith('k')
    expect(getModelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-1.5-pro',
        systemInstruction: expect.any(String) as unknown as string,
      }),
    )
  })

  it('forwards the user prompt as the contents payload', async () => {
    generateMock.mockResolvedValue({ stream: makeFakeStream([]) })
    const { geminiAdapter } = await import('./geminiAdapter')

    await collect(geminiAdapter({ apiKey: 'k', prompt: 'meu app', model: 'gemini-1.5-pro' }))

    const [request] = generateMock.mock.calls[0] as [
      { contents: Array<{ role: string; parts: Array<{ text: string }> }> },
    ]
    expect(request.contents).toEqual([{ role: 'user', parts: [{ text: 'meu app' }] }])
  })

  it('yields only non-empty text chunks', async () => {
    generateMock.mockResolvedValue({ stream: makeFakeStream(['Hello ', '', 'world']) })
    const { geminiAdapter } = await import('./geminiAdapter')

    const chunks = await collect(
      geminiAdapter({ apiKey: 'k', prompt: 'p', model: 'gemini-1.5-pro' }),
    )
    expect(chunks).toEqual(['Hello ', 'world'])
  })

  it('aborts between chunks when the signal flips', async () => {
    const controller = new AbortController()
    generateMock.mockResolvedValue({
      stream: {
        [Symbol.asyncIterator]() {
          let calls = 0
          return {
            next: async () => {
              calls += 1
              if (calls === 1) {
                return Promise.resolve({ value: { text: () => 'first' }, done: false })
              }
              if (calls === 2) {
                controller.abort()
                return Promise.resolve({ value: { text: () => 'second' }, done: false })
              }
              return Promise.resolve({ value: undefined, done: true })
            },
          }
        },
      },
    })
    const { geminiAdapter } = await import('./geminiAdapter')

    await expect(
      collect(
        geminiAdapter({
          apiKey: 'k',
          prompt: 'p',
          model: 'gemini-1.5-pro',
          signal: controller.signal,
        }),
      ),
    ).rejects.toMatchObject({ kind: 'aborted' })
  })

  it('maps an api-key-related error message into StreamError("invalid-key")', async () => {
    generateMock.mockRejectedValue(new Error('API key not valid. Please pass a valid API key.'))
    const { geminiAdapter } = await import('./geminiAdapter')

    await expect(
      collect(geminiAdapter({ apiKey: 'bad', prompt: 'p', model: 'gemini-1.5-pro' })),
    ).rejects.toMatchObject({ kind: 'invalid-key' })
  })

  it('maps a quota error into StreamError("rate-limit")', async () => {
    generateMock.mockRejectedValue(new Error('Resource has been exhausted (e.g. check quota).'))
    const { geminiAdapter } = await import('./geminiAdapter')

    await expect(
      collect(geminiAdapter({ apiKey: 'k', prompt: 'p', model: 'gemini-1.5-pro' })),
    ).rejects.toMatchObject({ kind: 'rate-limit' })
  })
})
