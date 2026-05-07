import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '../../routes/paths'

function GuestActions() {
  return (
    <div className="flex items-center gap-4">
      <Link
        to={ROUTE_PATHS.login}
        className="text-sm text-text-secondary transition-colors duration-fast hover:text-text-primary"
      >
        Entrar
      </Link>
      <Link
        to={ROUTE_PATHS.register}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-primary transition-colors duration-fast hover:bg-accent-hover"
      >
        Cadastrar
      </Link>
    </div>
  )
}

export default GuestActions
