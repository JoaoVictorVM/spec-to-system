import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '../../routes/paths'

/**
 * Placeholder for now — Phase 4 checkpoint 5 will swap this for an
 * AuthContext-aware variant that shows the user email + logout when
 * authenticated.
 */
function HeaderActions() {
  return (
    <nav aria-label="Account">
      <Link
        to={ROUTE_PATHS.login}
        className="text-sm text-text-secondary transition-colors duration-fast hover:text-text-primary"
      >
        Entrar
      </Link>
    </nav>
  )
}

export default HeaderActions
