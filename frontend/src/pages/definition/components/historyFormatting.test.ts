import { describe, expect, it } from 'vitest'
import { formatHistoryDate, summarizePrompt } from './historyFormatting'

describe('formatHistoryDate', () => {
  it('formats an ISO string in pt-BR with date and time', () => {
    const result = formatHistoryDate('2026-01-15T14:30:00Z')
    // Avoid asserting timezone-sensitive bits — assert the structural pieces.
    expect(result).toMatch(/\d{2}/) // day
    expect(result).toMatch(/·/) // separator
    expect(result).toContain('2026')
  })

  it('accepts a Date directly', () => {
    const date = new Date('2026-06-01T12:00:00Z')
    expect(formatHistoryDate(date)).toContain('2026')
  })
})

describe('summarizePrompt', () => {
  it('returns the prompt as-is when short enough', () => {
    expect(summarizePrompt('um app simples')).toBe('um app simples')
  })

  it('collapses internal whitespace', () => {
    expect(summarizePrompt('um   app\n\nsimples')).toBe('um app simples')
  })

  it('truncates long prompts with an ellipsis', () => {
    const long = 'a'.repeat(200)
    const summary = summarizePrompt(long)
    expect(summary.length).toBeLessThan(long.length)
    expect(summary.endsWith('…')).toBe(true)
  })
})
