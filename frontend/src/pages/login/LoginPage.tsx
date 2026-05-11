import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { authErrorMessage, useAuth } from '../../auth'
import AuthFormCard from '../../components/ui/AuthFormCard'
import Button from '../../components/ui/Button'
import EmailField from '../../components/ui/EmailField'
import PasswordField from '../../components/ui/PasswordField'
import { ROUTE_PATHS } from '../../routes/paths'

interface LoginLocationState {
  from?: string
  registeredEmail?: string
}

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navState = location.state as LoginLocationState | null

  const [email, setEmail] = useState(navState?.registeredEmail ?? '')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setErrorMessage(null)
    try {
      await login(email.trim(), password)
      const target = navState?.from ?? ROUTE_PATHS.definition
      void navigate(target, { replace: true })
    } catch (error) {
      setErrorMessage(authErrorMessage(error, 'login'))
      setSubmitting(false)
    }
  }

  return (
    <AuthFormCard
      title="Entrar"
      subtitle="Acesse sua conta para salvar e rever especificações."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link
            to={ROUTE_PATHS.register}
            className="text-accent transition-colors duration-fast hover:text-accent-hover"
          >
            Cadastrar
          </Link>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          void handleSubmit(e)
        }}
        aria-label="Formulário de login"
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
          autoComplete="current-password"
          required
        />
        {errorMessage !== null && (
          <p role="alert" className="text-sm text-error">
            {errorMessage}
          </p>
        )}
        <Button type="submit" size="lg" disabled={!canSubmit} className="mt-2">
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthFormCard>
  )
}

export default LoginPage
