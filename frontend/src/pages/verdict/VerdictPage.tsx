import { useParams } from 'react-router-dom'

function VerdictPage() {
  const { sessionCode } = useParams<{ sessionCode: string }>()
  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold text-text-primary">Verdict</h1>
      <p className="mt-2 text-text-secondary">
        Session code: <code className="font-mono">{sessionCode}</code>
      </p>
      <p className="mt-2 text-text-secondary">Real content lands in Phase 7.</p>
    </main>
  )
}

export default VerdictPage
