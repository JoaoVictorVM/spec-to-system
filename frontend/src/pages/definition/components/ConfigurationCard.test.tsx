import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AiSessionProvider from '../../../ai/AiSessionProvider'
import ConfigurationCard from './ConfigurationCard'

describe('ConfigurationCard', () => {
  it('renders both provider selector and api key input as a single labeled region', () => {
    render(
      <AiSessionProvider>
        <ConfigurationCard />
      </AiSessionProvider>,
    )
    expect(screen.getByRole('region', { name: /configuração de ia/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/provedor de ia/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/chave de api/i)).toBeInTheDocument()
  })
})
