import Brand from './Brand'
import HeaderActions from './HeaderActions'

function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-4">
        <Brand />
        <HeaderActions />
      </div>
    </header>
  )
}

export default Header
