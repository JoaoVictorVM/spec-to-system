import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BackgroundOrbs from './BackgroundOrbs'

describe('BackgroundOrbs', () => {
  it('is decorative (aria-hidden) and pointer-events none', () => {
    const { container } = render(<BackgroundOrbs />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.getAttribute('aria-hidden')).toBe('true')
    expect(wrapper.className).toContain('pointer-events-none')
  })

  it('renders three orbs', () => {
    const { container } = render(<BackgroundOrbs />)
    expect(container.querySelectorAll('.orb')).toHaveLength(3)
  })
})
