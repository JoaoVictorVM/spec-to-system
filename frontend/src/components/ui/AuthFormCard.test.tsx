import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AuthFormCard from './AuthFormCard'

describe('AuthFormCard', () => {
  it('renders the title as an h1', () => {
    render(
      <AuthFormCard title="Entrar">
        <p>body</p>
      </AuthFormCard>,
    )
    expect(screen.getByRole('heading', { level: 1, name: /entrar/i })).toBeInTheDocument()
  })

  it('renders the subtitle when provided', () => {
    render(
      <AuthFormCard title="Entrar" subtitle="Acesse sua conta">
        <p>body</p>
      </AuthFormCard>,
    )
    expect(screen.getByText(/acesse sua conta/i)).toBeInTheDocument()
  })

  it('renders the body slot', () => {
    render(
      <AuthFormCard title="X">
        <p data-testid="body">body content</p>
      </AuthFormCard>,
    )
    expect(screen.getByTestId('body')).toBeInTheDocument()
  })

  it('renders the footer slot when provided', () => {
    render(
      <AuthFormCard title="X" footer={<span data-testid="footer">foot</span>}>
        <p>body</p>
      </AuthFormCard>,
    )
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })
})
