import type { HTMLAttributes, ReactNode } from 'react'

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  /** Optional eyebrow label shown above the heading. */
  eyebrow?: string
  /** Section heading (h2). */
  heading?: ReactNode
  /** Lead paragraph below the heading. */
  lead?: ReactNode
}

function Section({ children, eyebrow, heading, lead, className = '', ...rest }: SectionProps) {
  return (
    <section className={`relative py-15 md:py-16 ${className}`} {...rest}>
      <div className="mx-auto max-w-screen-xl px-6">
        {(eyebrow ?? heading ?? lead) !== undefined && (
          <div className="mx-auto mb-12 max-w-3xl text-center">
            {eyebrow !== undefined && (
              <p className="mb-4 text-sm font-medium uppercase tracking-wide text-accent">
                {eyebrow}
              </p>
            )}
            {heading !== undefined && (
              <h2 className="text-3xl font-semibold leading-tight tracking-tracked text-text-primary md:text-4xl lg:text-5xl">
                {heading}
              </h2>
            )}
            {lead !== undefined && (
              <p className="mt-5 text-lg leading-relaxed text-text-secondary md:text-xl">{lead}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

export default Section
