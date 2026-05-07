import GlassCard from '../../../components/ui/GlassCard'
import Reveal from '../../../components/ui/Reveal'
import Section from '../../../components/ui/Section'

interface Step {
  number: string
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Descreva seu sistema',
    description:
      'Conte em linguagem natural o que você quer construir — funcionalidades, escala, restrições.',
  },
  {
    number: '02',
    title: 'Escolha seu provedor de IA',
    description:
      'OpenAI, Anthropic ou Google Gemini. Sua chave de API fica apenas no seu navegador.',
  },
  {
    number: '03',
    title: 'Receba a especificação',
    description:
      'Markdown estruturado com decisões técnicas, gerado em tempo real direto do provedor.',
  },
]

function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="Como funciona"
      heading="Três passos. Sem fricção."
      lead="Sem cadastro obrigatório, sem custos de IA do nosso lado — você usa sua própria chave."
    >
      <ol className="grid grid-cols-1 gap-6 md:grid-cols-3" aria-label="Passos do fluxo">
        {STEPS.map((step, index) => (
          <Reveal key={step.number} delayMs={index * 100}>
            <GlassCard
              variant="strong"
              className="h-full p-8 transition-base ease-out-quint hover:shadow-glow"
              role="listitem"
            >
              <span className="font-mono text-sm font-medium tracking-wide text-accent">
                {step.number}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-text-primary md:text-2xl">
                {step.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-text-secondary">
                {step.description}
              </p>
            </GlassCard>
          </Reveal>
        ))}
      </ol>
    </Section>
  )
}

export default HowItWorks
