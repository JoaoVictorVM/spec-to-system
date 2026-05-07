import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '../../routes/paths'

function Brand() {
  return (
    <Link
      to={ROUTE_PATHS.landing}
      className="font-semibold text-text-primary transition-colors duration-fast hover:text-accent"
      aria-label="Spec-To-System home"
    >
      Spec-To-System
    </Link>
  )
}

export default Brand
