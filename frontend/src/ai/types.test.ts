import { describe, expect, it } from 'vitest'
import { AI_PROVIDERS, findProvider } from './types'

describe('AI provider catalog', () => {
  it('exposes the three providers from the PRD (OpenAI, Anthropic, Gemini)', () => {
    expect(AI_PROVIDERS.map((p) => p.id)).toEqual(['openai', 'anthropic', 'gemini'])
  })

  it('every provider has a label, default model, brand color and initial', () => {
    for (const provider of AI_PROVIDERS) {
      expect(provider.label.length).toBeGreaterThan(0)
      expect(provider.defaultModel.length).toBeGreaterThan(0)
      expect(provider.brandColorVar.length).toBeGreaterThan(0)
      expect(provider.initial.length).toBe(1)
    }
  })

  it('findProvider returns the matching entry', () => {
    expect(findProvider('openai').label).toBe('OpenAI')
  })

  it('findProvider throws for unknown ids', () => {
    // @ts-expect-error testing the runtime guard with an invalid id
    expect(() => findProvider('grok')).toThrow(/unknown ai provider/i)
  })
})
