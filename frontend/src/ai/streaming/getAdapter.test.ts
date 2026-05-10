import { describe, expect, it } from 'vitest'
import { adapterRegistry, getAdapter } from './getAdapter'

describe('adapter registry', () => {
  it('exposes lazy loaders for the three PRD providers', () => {
    expect(Object.keys(adapterRegistry).sort()).toEqual(['anthropic', 'gemini', 'openai'])
    expect(typeof adapterRegistry.openai).toBe('function')
    expect(typeof adapterRegistry.anthropic).toBe('function')
    expect(typeof adapterRegistry.gemini).toBe('function')
  })

  it('getAdapter resolves to a function (an async generator factory)', async () => {
    const adapter = await getAdapter('openai')
    expect(typeof adapter).toBe('function')
  })
})
