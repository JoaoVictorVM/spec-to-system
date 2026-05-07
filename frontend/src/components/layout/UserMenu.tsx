import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth'
import { ROUTE_PATHS } from '../../routes/paths'

interface UserMenuProps {
  email: string
}

function UserMenu({ email }: UserMenuProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout(): void {
    void (async () => {
      try {
        await logout()
      } catch {
        // Best-effort: even if the API fails, route the user back to landing.
      }
      void navigate(ROUTE_PATHS.landing)
    })()
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-text-secondary" aria-label="Logged in as">
        {email}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-text-secondary transition-colors duration-fast hover:text-text-primary"
      >
        Sair
      </button>
    </div>
  )
}

export default UserMenu
