import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AppRoutes from './AppRoutes'
import { buildVerdictPath } from './paths'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('AppRoutes', () => {
  it('renders LandingPage at /', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1, name: /landing/i })).toBeInTheDocument()
  })

  it('renders DefinitionPage at /definition', () => {
    renderAt('/definition')
    expect(screen.getByRole('heading', { level: 1, name: /definition/i })).toBeInTheDocument()
  })

  it('renders VerdictPage at /verdict/:sessionCode and exposes the param', () => {
    renderAt(buildVerdictPath('abc123'))
    expect(screen.getByRole('heading', { level: 1, name: /verdict/i })).toBeInTheDocument()
    expect(screen.getByText('abc123')).toBeInTheDocument()
  })

  it('renders LoginPage at /login', () => {
    renderAt('/login')
    expect(screen.getByRole('heading', { level: 1, name: /login/i })).toBeInTheDocument()
  })

  it('renders RegisterPage at /register', () => {
    renderAt('/register')
    expect(screen.getByRole('heading', { level: 1, name: /register/i })).toBeInTheDocument()
  })
})
