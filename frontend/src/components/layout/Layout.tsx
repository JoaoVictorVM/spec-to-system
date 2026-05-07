import { Outlet } from 'react-router-dom'
import Header from './Header'

function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text-primary">
      <Header />
      <Outlet />
    </div>
  )
}

export default Layout
