import GlassCard from '../../../components/ui/GlassCard'
import Reveal from '../../../components/ui/Reveal'
import Section from '../../../components/ui/Section'

interface Feature {
  title: string
  description: string
}

const FEATURES: Feature[] = [
  { title: 'Arquitetura', description: 'Padrão recomendado e justificativa para seu caso.' },
  { title: 'Frontend', description: 'Framework, biblioteca de UI e ferramentas de build.' },
  { title: 'Backend', description: 'Linguagem, framework e organização do código.' },
  { title: 'Banco de dados', description: 'Tipo, engine e modelagem inicial sugerida.' },
  { title: 'Infraestrutura', description: 'Hospedagem, CDN, containers e custo aproximado.' },
  { title: 'Segurança', description: 'Autenticação, criptografia e mitigações chave.' },
  { title: 'Deploy', description: 'Estratégia de CI/CD e ambientes recomendados.' },
  { title: 'Escalabilidade', description: 'Caminhos para escala horizontal e vertical.' },
  { title: 'Testes', description: 'Estratégia: unitário, integração e E2E.' },
  { title: 'Complexidade', description: 'Estimativa de esforço — baixa, média ou alta.' },
  { title: 'Recomendações', description: 'Observações específicas para seu contexto.' },
]

function Features() {
  return (
    <Section
      eyebrow="O que a IA analisa"
      heading="Tudo que você precisa para começar a codar."
      lead="Cada especificação cobre os domínios que importam — sem buzzwords, sem vendas."
    >
      <ul
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Categorias analisadas"
      >
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delayMs={(index % 6) * 60}>
            <GlassCard
              className="group h-full p-6 transition-base ease-out-quint hover:shadow-glow-soft"
              role="listitem"
            >
              <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {feature.description}
              </p>
            </GlassCard>
          </Reveal>
        ))}
      </ul>
    </Section>
  )
}

export default Features
