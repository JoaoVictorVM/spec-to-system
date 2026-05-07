export const ROUTE_PATHS = {
  landing: '/',
  definition: '/definition',
  verdict: '/verdict/:sessionCode',
  login: '/login',
  register: '/register',
} as const

export function buildVerdictPath(sessionCode: string): string {
  return `/verdict/${encodeURIComponent(sessionCode)}`
}
