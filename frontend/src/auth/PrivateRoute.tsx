import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTE_PATHS } from '../routes/paths'
import { useAuth } from './useAuth'

/**
 * Wraps authenticated-only routes. While the session is loading, renders
 * nothing to avoid a redirect flash; on unauthenticated, redirects to /login
 * preserving the original target so post-login flow can resume.
 */
function PrivateRoute() {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') {
    return <p className="sr-only">Verifying session</p>
  }

  if (state.status === 'unauthenticated') {
    return <Navigate to={ROUTE_PATHS.login} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export default PrivateRoute
