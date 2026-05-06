import { apiFetch } from './client'
import type { Specification, SpecificationListResult } from './types'

export interface CreateSpecificationInput {
  sessionCode: string
  prompt: string
  response: string
}

export interface ListSpecificationsParams {
  cursor?: string
  limit?: number
}

export const specificationsApi = {
  create(input: CreateSpecificationInput): Promise<Specification> {
    return apiFetch<Specification>('/specifications', {
      method: 'POST',
      json: input,
    })
  },

  findByCode(code: string): Promise<Specification> {
    return apiFetch<Specification>(`/specifications/${encodeURIComponent(code)}`, {
      method: 'GET',
    })
  },

  list(params: ListSpecificationsParams = {}): Promise<SpecificationListResult> {
    const search = new URLSearchParams()
    if (params.cursor !== undefined) search.set('cursor', params.cursor)
    if (params.limit !== undefined) search.set('limit', String(params.limit))
    const qs = search.toString()
    const path = qs.length > 0 ? `/specifications?${qs}` : '/specifications'
    return apiFetch<SpecificationListResult>(path, { method: 'GET' })
  },
}
