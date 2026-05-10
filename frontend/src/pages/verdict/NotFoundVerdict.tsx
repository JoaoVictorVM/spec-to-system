import LinkButton from '../../components/ui/LinkButton'
import { ROUTE_PATHS } from '../../routes/paths'

interface NotFoundVerdictProps {
  sessionCode: string
}

function NotFoundVerdict({ sessionCode }: NotFoundVerdictProps) {
  return (
    <main className="flex-1">
      <div className="mx-auto flex max-w-screen-md flex-col gap-6 px-6 py-15 md:py-16">
        <div className="rounded-md border border-border bg-surface px-6 py-10 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">404</p>
          <h1 className="mt-3 text-2xl font-semibold text-text-primary md:text-3xl">
            Especificação não encontrada
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Não encontramos uma especificação salva com o código{' '}
            <code className="font-mono text-text-primary">{sessionCode}</code>. Pode ter sido
            apagada, ou o link está incorreto.
          </p>
          <div className="mt-6">
            <LinkButton to={ROUTE_PATHS.definition}>Criar nova especificação</LinkButton>
          </div>
        </div>
      </div>
    </main>
  )
}

export default NotFoundVerdict
