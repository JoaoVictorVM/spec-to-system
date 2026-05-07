import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContextHarness } from '../../auth/testing/AuthContextHarness'
import { makeAuthContextValue } from '../../auth/testing/makeAuthContextValue'
import Header from './Header'

function renderHeader(
  state: Parameters<typeof makeAuthContextValue>[0] = { status: 'unauthenticated' },
) {
  return render(
    <MemoryRouter>
      <AuthContextHarness value={makeAuthContextValue(state)}>
        <Header />
      </AuthContextHarness>
    </MemoryRouter>,
  )
}

describe('Header', () => {
  it('renders inside a banner landmark', () => {
    renderHeader()
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('shows the brand and guest actions when unauthenticated', () => {
    renderHeader({ status: 'unauthenticated' })
    expect(screen.getByRole('link', { name: /spec-to-system/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /entrar/i })).toBeInTheDocument()
  })
})
