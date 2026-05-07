import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContextHarness } from '../../auth/testing/AuthContextHarness'
import { makeAuthContextValue } from '../../auth/testing/makeAuthContextValue'
import Layout from './Layout'

function StubChild() {
  return <p>child route content</p>
}

describe('Layout', () => {
  it('renders the Header and the matched child route via Outlet', () => {
    render(
      <MemoryRouter initialEntries={['/x']}>
        <AuthContextHarness value={makeAuthContextValue({ status: 'unauthenticated' })}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/x" element={<StubChild />} />
            </Route>
          </Routes>
        </AuthContextHarness>
      </MemoryRouter>,
    )

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('child route content')).toBeInTheDocument()
  })
})
