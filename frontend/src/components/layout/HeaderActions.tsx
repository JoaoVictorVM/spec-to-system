import { useAuth } from '../../auth'
import GuestActions from './GuestActions'
import UserMenu from './UserMenu'

function HeaderActions() {
  const { state } = useAuth()

  return (
    <nav aria-label="Account">
      {state.status === 'loading' && <span className="sr-only">Loading session</span>}
      {state.status === 'unauthenticated' && <GuestActions />}
      {state.status === 'authenticated' && <UserMenu email={state.user.email} />}
    </nav>
  )
}

export default HeaderActions
