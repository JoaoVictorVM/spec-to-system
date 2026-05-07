import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('mounts the router and renders the landing page at /', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /landing/i })).toBeInTheDocument()
  })
})
