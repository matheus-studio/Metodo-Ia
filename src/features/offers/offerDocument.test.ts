import { describe, expect, it } from 'vitest'
import type { Offer } from '@/types/domain'
import { offerGaps, offerToMarkdown } from './offerDocument'

function makeOffer(patch: Partial<Offer> = {}): Offer {
  return {
    id: 'o1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    name: 'Presença digital para restaurantes',
    clientOrSegment: 'Cantina do Bairro',
    deliverables: ['Site de uma página', 'Cardápio digital'],
    clientResponsibilities: ['Enviar fotos'],
    differentials: [],
    nextSteps: ['Aprovação da proposta'],
    currency: 'BRL',
    status: 'rascunho',
    ...patch,
  }
}

describe('offerToMarkdown', () => {
  it('abre com o nome e o destinatário', () => {
    const text = offerToMarkdown(makeOffer())
    expect(text.startsWith('# Presença digital para restaurantes')).toBe(true)
    expect(text).toContain('**Para:** Cantina do Bairro')
  })

  it('omite seções vazias em vez de deixar título órfão', () => {
    const text = offerToMarkdown(makeOffer({ problem: '', solution: '   ' }))
    expect(text).not.toContain('## O problema')
    expect(text).not.toContain('## A solução proposta')
  })

  it('formata o preço em reais', () => {
    const text = offerToMarkdown(makeOffer({ price: 1890 }))
    expect(text).toMatch(/R\$\s?1\.890,00/)
  })

  it('inclui prazo e revisões quando definidos', () => {
    const text = offerToMarkdown(makeOffer({ deadlineDays: 10, revisions: 2 }))
    expect(text).toContain('**Prazo:** 10 dias úteis')
    expect(text).toContain('**Revisões incluídas:** 2')
  })

  it('lista entregáveis como itens', () => {
    const text = offerToMarkdown(makeOffer())
    expect(text).toContain('- Site de uma página')
    expect(text).toContain('- Cardápio digital')
  })

  it('não deixa três quebras de linha seguidas', () => {
    expect(offerToMarkdown(makeOffer({ price: 100 }))).not.toMatch(/\n{3}/)
  })
})

describe('offerGaps', () => {
  it('aponta o que falta em uma oferta incompleta', () => {
    const gaps = offerGaps(makeOffer())
    expect(gaps.join(' ')).toContain('problema')
    expect(gaps.join(' ')).toContain('preço')
    expect(gaps.join(' ')).toContain('revisões')
  })

  it('fica vazio quando a proposta está completa', () => {
    const gaps = offerGaps(
      makeOffer({
        problem: 'Sem página própria',
        solution: 'Site de uma página',
        price: 1200,
        deadlineDays: 10,
        revisions: 2,
      }),
    )
    expect(gaps).toHaveLength(0)
  })

  it('cobra entregáveis e responsabilidades do cliente', () => {
    const gaps = offerGaps(makeOffer({ deliverables: [], clientResponsibilities: [] }))
    expect(gaps.some((gap) => gap.includes('entregáveis'))).toBe(true)
    expect(gaps.some((gap) => gap.includes('responsabilidades'))).toBe(true)
  })
})
