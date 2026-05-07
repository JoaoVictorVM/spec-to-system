import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AiSessionProvider from './AiSessionProvider'
import { useAiSession } from './useAiSession'

function Probe() {
  const session = useAiSession()
  return (
    <>
      <p data-testid="provider">{session.providerId ?? 'none'}</p>
      <p data-testid="key">{session.apiKey === '' ? 'empty' : session.apiKey}</p>
      <button
        type="button"
        onClick={() => {
          session.setProviderId('openai')
        }}
      >
        set-provider
      </button>
      <button
        type="button"
        onClick={() => {
          session.setApiKey('sk-test')
        }}
      >
        set-key
      </button>
      <button type="button" onClick={() => session.clear()}>
        clear
      </button>
    </>
  )
}

describe('AiSessionProvider', () => {
  it('starts with null provider and empty key', () => {
    render(
      <AiSessionProvider>
        <Probe />
      </AiSessionProvider>,
    )
    expect(screen.getByTestId('provider')).toHaveTextContent('none')
    expect(screen.getByTestId('key')).toHaveTextContent('empty')
  })

  it('updates provider and key independently', () => {
    render(
      <AiSessionProvider>
        <Probe />
      </AiSessionProvider>,
    )

    act(() => {
      screen.getByText('set-provider').click()
    })
    expect(screen.getByTestId('provider')).toHaveTextContent('openai')

    act(() => {
      screen.getByText('set-key').click()
    })
    expect(screen.getByTestId('key')).toHaveTextContent('sk-test')
  })

  it('clear resets both fields', () => {
    render(
      <AiSessionProvider>
        <Probe />
      </AiSessionProvider>,
    )

    act(() => {
      screen.getByText('set-provider').click()
      screen.getByText('set-key').click()
    })
    act(() => {
      screen.getByText('clear').click()
    })

    expect(screen.getByTestId('provider')).toHaveTextContent('none')
    expect(screen.getByTestId('key')).toHaveTextContent('empty')
  })
})
