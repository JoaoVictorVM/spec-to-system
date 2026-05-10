import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AiSessionProvider from '../../../ai/AiSessionProvider'
import { useAiSession } from '../../../ai/useAiSession'
import PromptForm from './PromptForm'

interface VerdictState {
  prompt?: string
}

function VerdictProbe() {
  const location = useLocation()
  const state = location.state as VerdictState | null
  return (
    <div>
      <p data-testid="path">{location.pathname}</p>
      <p data-testid="prompt">{state?.prompt ?? 'none'}</p>
    </div>
  )
}

/** Pre-fills the AiSession context with provider + key so we can drive the form. */
function PrefilledSession({
  providerId,
  apiKey,
  children,
}: {
  providerId: 'openai' | 'anthropic' | 'gemini' | null
  apiKey: string
  children: React.ReactNode
}) {
  const session = useAiSession()
  useEffect(() => {
    session.setProviderId(providerId)
    session.setApiKey(apiKey)
  }, [providerId, apiKey, session])
  return <>{children}</>
}

function renderForm(opts: {
  providerId?: 'openai' | 'anthropic' | 'gemini' | null
  apiKey?: string
  initialPath?: string
}) {
  const { providerId = null, apiKey = '', initialPath = '/definition' } = opts
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AiSessionProvider>
        <PrefilledSession providerId={providerId} apiKey={apiKey}>
          <Routes>
            <Route path="/definition" element={<PromptForm />} />
            <Route path="/verdict/:sessionCode" element={<VerdictProbe />} />
          </Routes>
        </PrefilledSession>
      </AiSessionProvider>
    </MemoryRouter>,
  )
}

describe('PromptForm', () => {
  it('disables the submit button when the provider is missing', () => {
    renderForm({ providerId: null, apiKey: 'sk-x' })
    fireEvent.change(screen.getByLabelText(/descreva seu sistema/i), {
      target: { value: 'meu app' },
    })
    expect(screen.getByRole('button', { name: /gerar especificação/i })).toBeDisabled()
  })

  it('disables the submit button when the api key is missing', () => {
    renderForm({ providerId: 'openai', apiKey: '' })
    fireEvent.change(screen.getByLabelText(/descreva seu sistema/i), {
      target: { value: 'meu app' },
    })
    expect(screen.getByRole('button', { name: /gerar especificação/i })).toBeDisabled()
  })

  it('disables the submit button when the prompt is empty', () => {
    renderForm({ providerId: 'openai', apiKey: 'sk-x' })
    expect(screen.getByRole('button', { name: /gerar especificação/i })).toBeDisabled()
  })

  it('navigates to /verdict/:code with the prompt in state on submit', () => {
    renderForm({ providerId: 'openai', apiKey: 'sk-x' })
    fireEvent.change(screen.getByLabelText(/descreva seu sistema/i), {
      target: { value: 'um app de chat' },
    })

    fireEvent.click(screen.getByRole('button', { name: /gerar especificação/i }))

    const path = screen.getByTestId('path').textContent
    expect(path).toMatch(/^\/verdict\/[A-Za-z0-9_-]{6}$/)
    expect(screen.getByTestId('prompt')).toHaveTextContent('um app de chat')
  })

  it('trims whitespace before persisting the prompt and validates against an all-whitespace input', () => {
    renderForm({ providerId: 'openai', apiKey: 'sk-x' })
    fireEvent.change(screen.getByLabelText(/descreva seu sistema/i), {
      target: { value: '   ' },
    })
    expect(screen.getByRole('button', { name: /gerar especificação/i })).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/descreva seu sistema/i), {
      target: { value: '  meu app  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /gerar especificação/i }))
    expect(screen.getByTestId('prompt')).toHaveTextContent('meu app')
  })

  it('shows a hint pointing to the missing field', () => {
    const { rerender } = renderForm({ providerId: null, apiKey: '' })
    expect(screen.getByText(/selecione um provedor/i)).toBeInTheDocument()

    // Switching provider but missing key
    rerender(
      <MemoryRouter initialEntries={['/definition']}>
        <AiSessionProvider>
          <PrefilledSession providerId="openai" apiKey="">
            <Routes>
              <Route path="/definition" element={<PromptForm />} />
            </Routes>
          </PrefilledSession>
        </AiSessionProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText(/informe a chave de api/i)).toBeInTheDocument()
  })
})
