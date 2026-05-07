import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Features from './Features'

describe('Features', () => {
  it('renders the section heading', () => {
    render(<Features />)
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /tudo que você precisa para começar a codar/i,
      }),
    ).toBeInTheDocument()
  })

  it('lists the 11 PRD-mandated categories', () => {
    render(<Features />)
    const titles = [
      'Arquitetura',
      'Frontend',
      'Backend',
      'Banco de dados',
      'Infraestrutura',
      'Segurança',
      'Deploy',
      'Escalabilidade',
      'Testes',
      'Complexidade',
      'Recomendações',
    ]
    for (const title of titles) {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()
    }
  })

  it('uses an unordered list with the right aria-label', () => {
    render(<Features />)
    expect(screen.getByRole('list', { name: /categorias analisadas/i })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(11)
  })
})
