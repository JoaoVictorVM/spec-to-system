import BackgroundOrbs from '../../components/ui/BackgroundOrbs'
import Features from './sections/Features'
import FinalCta from './sections/FinalCta'
import Hero from './sections/Hero'
import HowItWorks from './sections/HowItWorks'

function LandingPage() {
  return (
    <main className="relative isolate flex-1 overflow-hidden">
      <BackgroundOrbs />
      <div className="relative">
        <Hero />
        <HowItWorks />
        <Features />
        <FinalCta />
      </div>
    </main>
  )
}

export default LandingPage
