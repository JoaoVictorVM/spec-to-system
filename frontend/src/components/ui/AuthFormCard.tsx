import type { ReactNode } from 'react'

interface AuthFormCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  /** Footer slot — typically a "Já tem conta?" / "Não tem conta?" link. */
  footer?: ReactNode
}

function AuthFormCard({ title, subtitle, children, footer }: AuthFormCardProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-md border border-border bg-surface px-6 py-8 md:px-8 md:py-10">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tracked text-text-primary md:text-3xl">
              {title}
            </h1>
            {subtitle !== undefined && <p className="text-sm text-text-secondary">{subtitle}</p>}
          </header>
          <div className="mt-6">{children}</div>
        </div>
        {footer !== undefined && (
          <p className="mt-6 text-center text-sm text-text-secondary">{footer}</p>
        )}
      </div>
    </main>
  )
}

export default AuthFormCard
