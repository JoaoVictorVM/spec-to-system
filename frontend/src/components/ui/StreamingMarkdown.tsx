import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface StreamingMarkdownProps {
  content: string
  /** When true, renders a blinking cursor at the end of the content. */
  streaming: boolean
}

function StreamingMarkdown({ content, streaming }: StreamingMarkdownProps) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      {streaming && (
        <span data-testid="streaming-cursor" aria-hidden="true" className="cursor-blink">
          ▍
        </span>
      )}
    </div>
  )
}

export default StreamingMarkdown
