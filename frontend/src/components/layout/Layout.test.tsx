import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Layout from './Layout'

function StubChild() {
  return <p>child route content</p>
}

describe('Layout', () => {
  it('renders the Header and the matched child route via Outlet', () => {
    render(
      <MemoryRouter initialEntries={['/x']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/x" element={<StubChild />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('child route content')).toBeInTheDocument()
  })
})
