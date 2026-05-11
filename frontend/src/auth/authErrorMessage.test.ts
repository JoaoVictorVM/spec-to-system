import { describe, expect, it } from 'vitest'
import { ApiError } from '../api'
import { authErrorMessage } from './authErrorMessage'

describe('authErrorMessage', () => {
  it('translates 401 on login into "Email ou senha incorretos"', () => {
    expect(authErrorMessage(new ApiError(401, 'Unauthorized', null), 'login')).toBe(
      'Email ou senha incorretos.',
    )
  })

  it('does not use the "incorrect credentials" message on register 401', () => {
    const msg = authErrorMessage(new ApiError(401, 'Unauthorized', null), 'register')
    expect(msg).not.toMatch(/incorretos/i)
  })

  it('translates 409 on register into "email já cadastrado"', () => {
    expect(authErrorMessage(new ApiError(409, 'Conflict', null), 'register')).toMatch(
      /já está cadastrado/i,
    )
  })

  it('uses the backend message for 400 when present (string)', () => {
    expect(
      authErrorMessage(
        new ApiError(400, 'Bad Request', { message: 'password must contain a digit' }),
        'register',
      ),
    ).toBe('password must contain a digit')
  })

  it('uses the first item for 400 when the backend sends an array', () => {
    expect(
      authErrorMessage(
        new ApiError(400, 'Bad Request', { message: ['email must be valid', 'password short'] }),
        'register',
      ),
    ).toBe('email must be valid')
  })

  it('falls back to a generic 400 message when body has no message', () => {
    expect(authErrorMessage(new ApiError(400, 'Bad Request', null), 'register')).toMatch(
      /dados inválidos/i,
    )
  })

  it('translates 429 into "muitas tentativas"', () => {
    expect(authErrorMessage(new ApiError(429, 'Too Many Requests', null), 'login')).toMatch(
      /muitas tentativas/i,
    )
  })

  it('translates 5xx into a server-error hint', () => {
    expect(authErrorMessage(new ApiError(500, 'Internal', null), 'login')).toMatch(/servidor/i)
  })

  it('translates a TypeError (network failure) into a connection hint', () => {
    expect(authErrorMessage(new TypeError('Failed to fetch'), 'login')).toMatch(/falha de conexão/i)
  })

  it('falls back to a generic message for unknown errors', () => {
    expect(authErrorMessage('weird', 'login')).toMatch(/erro inesperado/i)
  })
})
