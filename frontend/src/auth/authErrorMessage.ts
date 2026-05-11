import { ApiError } from '../api'

interface BackendErrorBody {
  message?: string | string[]
}

function readMessage(body: unknown): string | null {
  if (body !== null && typeof body === 'object' && 'message' in body) {
    const message = (body as BackendErrorBody).message
    if (typeof message === 'string' && message.length > 0) return message
    if (Array.isArray(message) && message.length > 0 && typeof message[0] === 'string') {
      return message[0]
    }
  }
  return null
}

/**
 * Translates auth-flow errors into user-friendly Portuguese messages. Kept in
 * a shared helper so login and register stay consistent.
 */
export function authErrorMessage(error: unknown, mode: 'login' | 'register'): string {
  if (error instanceof ApiError) {
    if (error.status === 401 && mode === 'login') {
      return 'Email ou senha incorretos.'
    }
    if (error.status === 409 && mode === 'register') {
      return 'Este email já está cadastrado. Tente fazer login.'
    }
    if (error.status === 400) {
      return readMessage(error.body) ?? 'Dados inválidos. Verifique e tente novamente.'
    }
    if (error.status === 429) {
      return 'Muitas tentativas em pouco tempo. Aguarde alguns segundos.'
    }
    if (error.status >= 500) {
      return 'Erro no servidor. Tente novamente em alguns instantes.'
    }
    return readMessage(error.body) ?? 'Não foi possível concluir a requisição.'
  }
  if (error instanceof TypeError) {
    return 'Falha de conexão. Verifique sua rede e tente novamente.'
  }
  return 'Erro inesperado. Tente novamente.'
}
