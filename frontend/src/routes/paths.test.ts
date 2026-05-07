import { describe, expect, it } from 'vitest'
import { buildVerdictPath, ROUTE_PATHS } from './paths'

describe('paths', () => {
  it('exposes the canonical route paths', () => {
    expect(ROUTE_PATHS.landing).toBe('/')
    expect(ROUTE_PATHS.verdict).toBe('/verdict/:sessionCode')
  })

  it('buildVerdictPath produces the URL for a given session code', () => {
    expect(buildVerdictPath('abc123')).toBe('/verdict/abc123')
  })

  it('buildVerdictPath URL-encodes the code', () => {
    expect(buildVerdictPath('a/b c')).toBe('/verdict/a%2Fb%20c')
  })
})
