/**
 * Ambient blurred gradient orbs drifting slowly behind the content. Decorative
 * — pointer-events none, hidden from the a11y tree.
 */
function BackgroundOrbs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="orb orb-1 animate-orb-a" />
      <div className="orb orb-2 animate-orb-b" />
      <div className="orb orb-3 animate-orb-c" />
      <div className="absolute inset-0 bg-grid-fade" />
    </div>
  )
}

export default BackgroundOrbs
