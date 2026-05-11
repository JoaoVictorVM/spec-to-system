import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authErrorMessage, useAuth } from '../../auth'
import AuthFormCard from '../../components/ui/AuthFormCard'
import Button from '../../components/ui/Button'
import EmailField from '../../components/ui/EmailField'
import PasswordField from '../../components/ui/PasswordField'
import { ROUTE_PATHS } from '../../routes/paths'

const PASSWORD_MIN_LENGTH = 8

interface ClientValidation {
  ok: boolean
  message: string | null
}

function validate(email: string, password: string): ClientValidation {
  const trimmedEmail = email.trim()
  if (trimmedEmail.length === 0) return { ok: false, message: 'Informe seu email.' }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      message: `A senha precisa ter ao menos ${String(PASSWORD_MIN_LENGTH)} caracteres.`,
    }
  }
  if (!/[A-Za-z]/.test(password)) {
    return { ok: false, message: 'A senha precisa conter ao menos uma letra.' }
  }
  if (!/\d/.test(password)) {
    return { ok: false, message: 'A senha precisa conter ao menos um número.' }
  }
  return { ok: true, message: null }
}

function RegisterPage() {
  const { register, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!canSubmit) return

    const clientCheck = validate(email, password)
    if (!clientCheck.ok) {
      setErrorMessage(clientCheck.message)
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    const trimmedEmail = email.trim()
    try {
      await register(trimmedEmail, password)
    } catch (error) {
      setErrorMessage(authErrorMessage(error, 'register'))
      setSubmitting(false)
      return
    }

    // Auto-login after a successful register. If auto-login fails for any
    // reason, fall back to the login page with the email pre-filled.
    try {
      await login(trimmedEmail, password)
      void navigate(ROUTE_PATHS.definition, { replace: true })
    } catch {
      void navigate(ROUTE_PATHS.login, {
        replace: true,
        state: { registeredEmail: trimmedEmail },
      })
    }
  }

  return (
    <AuthFormCard
      title="Cadastrar"
      subtitle="Crie uma conta para salvar e rever suas especificações."
      footer={
        <>
          Já tem conta?{' '}
          <Link
            to={ROUTE_PATHS.login}
            className="text-accent transition-colors duration-fast hover:text-accent-hover"
          >
            Entrar
          </Link>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          void handleSubmit(e)
        }}
        aria-label="Formulário de cadastro"
        className="flex flex-col gap-4"
      >
        <EmailField
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
          }}
          disabled={submitting}
          required
        />
        <PasswordField
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
          }}
          disabled={submitting}
          autoComplete="new-password"
          hint="Pelo menos 8 caracteres, com uma letra e um número."
          required
        />
        {errorMessage !== null && (
          <p role="alert" className="text-sm text-error">
            {errorMessage}
          </p>
        )}
        <Button type="submit" size="lg" disabled={!canSubmit} className="mt-2">
          {submitting ? 'Criando conta…' : 'Cadastrar'}
        </Button>
      </form>
    </AuthFormCard>
  )
}

export default RegisterPage
