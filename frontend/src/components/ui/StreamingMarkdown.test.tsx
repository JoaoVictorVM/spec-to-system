import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StreamingMarkdown from './StreamingMarkdown'

describe('StreamingMarkdown', () => {
  it('renders empty content with the cursor while streaming', () => {
    render(<StreamingMarkdown content="" streaming />)
    expect(screen.getByTestId('streaming-cursor')).toBeInTheDocument()
  })

  it('does not render the cursor when streaming is false', () => {
    render(<StreamingMarkdown content="hello" streaming={false} />)
    expect(screen.queryByTestId('streaming-cursor')).toBeNull()
  })

  it('renders headings with semantic HTML', () => {
    render(<StreamingMarkdown content={'## Visão Geral\n\nUm parágrafo.'} streaming={false} />)
    expect(screen.getByRole('heading', { level: 2, name: /visão geral/i })).toBeInTheDocument()
    expect(screen.getByText('Um parágrafo.')).toBeInTheDocument()
  })

  it('renders bullet lists', () => {
    render(<StreamingMarkdown content={'- alpha\n- beta\n- gamma'} streaming={false} />)
    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('does not render raw HTML (XSS-safe by default)', () => {
    render(
      <StreamingMarkdown
        content={'<script>window.__hacked = true</script>safe text'}
        streaming={false}
      />,
    )
    expect(screen.getByText(/safe text/i)).toBeInTheDocument()
    // The script tag should appear as escaped text, not as a real script element.
    expect(document.querySelector('script[data-injected]')).toBeNull()
  })

  it('renders inline code with the markdown class scope', () => {
    const { container } = render(
      <StreamingMarkdown content={'use `npm install` to start'} streaming={false} />,
    )
    expect(container.querySelector('.markdown code')).not.toBeNull()
  })

  it('renders both headings and bold inline together', () => {
    render(
      <StreamingMarkdown
        content={'## Frontend\n\n**Next.js** com Tailwind CSS.'}
        streaming={false}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: /frontend/i })).toBeInTheDocument()
    expect(screen.getByText('Next.js')).toBeInTheDocument()
  })
})
