import LinkButton from '../../../components/ui/LinkButton'
import Reveal from '../../../components/ui/Reveal'
import { ROUTE_PATHS } from '../../../routes/paths'

function Hero() {
  return (
    <section className="relative pb-15 pt-15 md:pb-16 md:pt-16">
      <div className="mx-auto max-w-screen-xl px-6 text-center">
        <Reveal>
          <span className="surface-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium tracking-wide text-text-secondary">
            <span
              className="h-2 w-2 animate-pulse-glow rounded-full bg-accent"
              aria-hidden="true"
            />
            Sua chave de API. Sua privacidade.
          </span>
        </Reveal>

        <Reveal delayMs={120}>
          <h1 className="mt-8 text-4xl font-semibold leading-tight tracking-tracked md:text-5xl lg:text-6xl">
            <span className="bg-gradient-text">Da ideia ao stack</span>
            <br />
            <span className="bg-gradient-text-accent">em minutos</span>
          </h1>
        </Reveal>

        <Reveal delayMs={240}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary md:text-xl">
            Descreva o sistema que você quer construir e receba recomendações técnicas completas —
            arquitetura, banco, segurança, deploy e mais — geradas por IA usando sua própria chave
            de API.
          </p>
        </Reveal>

        <Reveal delayMs={360}>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <LinkButton to={ROUTE_PATHS.definition} size="lg">
              Começar agora
            </LinkButton>
            <LinkButton to="#how-it-works" variant="ghost" size="lg">
              Como funciona
            </LinkButton>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default Hero
