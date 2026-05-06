export interface PublicUser {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface AuthSession {
  user: PublicUser
}

export interface Specification {
  id: string
  sessionCode: string
  prompt: string
  response: string
  userId: string | null
  createdAt: string
}

export interface SpecificationListResult {
  items: Specification[]
  nextCursor: string | null
}
