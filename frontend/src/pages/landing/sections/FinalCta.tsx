import GlassCard from '../../../components/ui/GlassCard'
import LinkButton from '../../../components/ui/LinkButton'
import Reveal from '../../../components/ui/Reveal'
import { ROUTE_PATHS } from '../../../routes/paths'

function FinalCta() {
  return (
    <section className="relative py-15 md:py-16">
      <div className="mx-auto max-w-screen-xl px-6">
        <Reveal>
          <GlassCard variant="strong" className="mx-auto max-w-3xl p-10 text-center md:p-13">
            <h2 className="text-3xl font-semibold leading-tight tracking-tracked md:text-4xl lg:text-5xl">
              <span className="bg-gradient-text">Pronto para definir</span>
              <br />
              <span className="bg-gradient-text-accent">seu próximo sistema?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-text-secondary">
              Sem cadastro obrigatório. Sua chave de API nunca é enviada para nossos servidores.
            </p>
            <div className="mt-8">
              <LinkButton to={ROUTE_PATHS.definition} size="lg">
                Começar agora
              </LinkButton>
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </section>
  )
}

export default FinalCta
