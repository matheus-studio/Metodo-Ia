import { describe, expect, it } from 'vitest'
import type { Deal, DealStage } from '@/types/domain'
import { filterDeals, nextStage, summarizePipeline } from './crmLogic'

function makeDeal(stage: DealStage, patch: Partial<Deal> = {}): Deal {
  return {
    id: `d-${stage}-${patch.title ?? ''}`,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    title: patch.title ?? `Negociação ${stage}`,
    stage,
    ...patch,
  }
}

describe('nextStage', () => {
  it('avança pelo funil na ordem', () => {
    expect(nextStage('novo')).toBe('contatado')
    expect(nextStage('contatado')).toBe('respondeu')
    expect(nextStage('respondeu')).toBe('proposta')
    expect(nextStage('proposta')).toBe('negociacao')
  })

  it('do último estágio ativo leva ao fechamento', () => {
    expect(nextStage('negociacao')).toBe('fechado')
  })

  it('estágios finais não avançam', () => {
    expect(nextStage('fechado')).toBeNull()
    expect(nextStage('perdido')).toBeNull()
  })
})

describe('filterDeals', () => {
  const deals = [
    makeDeal('novo', { title: 'Cantina do Bairro' }),
    makeDeal('proposta', { title: 'Studio Pilates' }),
    makeDeal('fechado', { title: 'Padaria Central' }),
    makeDeal('perdido', { title: 'Mercado Norte' }),
  ]

  it('esconde encerradas por padrão', () => {
    const result = filterDeals(deals, {})
    expect(result).toHaveLength(2)
  })

  it('mostra encerradas quando pedido', () => {
    expect(filterDeals(deals, { includeClosed: true })).toHaveLength(4)
  })

  it('busca por título ignorando acento', () => {
    expect(filterDeals(deals, { text: 'cantina' })).toHaveLength(1)
  })

  it('filtra por estágio específico', () => {
    const result = filterDeals(deals, { stages: ['proposta'] })
    expect(result[0]?.title).toBe('Studio Pilates')
  })
})

describe('summarizePipeline', () => {
  const deals = [
    makeDeal('novo', { title: 'a', potentialValue: 1000 }),
    makeDeal('proposta', { title: 'b', potentialValue: 2500 }),
    makeDeal('negociacao', { title: 'c' }),
    makeDeal('fechado', { title: 'd', potentialValue: 9000 }),
    makeDeal('perdido', { title: 'e', potentialValue: 400 }),
  ]

  it('conta por estágio e separa encerradas', () => {
    const summary = summarizePipeline(deals)
    expect(summary.active).toBe(3)
    expect(summary.closed).toBe(1)
    expect(summary.lost).toBe(1)
    expect(summary.byStage.proposta).toBe(1)
  })

  it('soma apenas valores informados em negociações ativas', () => {
    const summary = summarizePipeline(deals)
    // 1000 + 2500; o valor da fechada e o da perdida não entram no funil ativo.
    expect(summary.declaredActiveValue).toBe(3500)
    expect(summary.dealsWithoutValue).toBe(1)
  })

  it('não aplica probabilidade por estágio — soma é soma, não previsão', () => {
    const summary = summarizePipeline([makeDeal('novo', { potentialValue: 1000 })])
    expect(summary.declaredActiveValue).toBe(1000)
  })

  it('devolve zeros para lista vazia', () => {
    const summary = summarizePipeline([])
    expect(summary.active).toBe(0)
    expect(summary.declaredActiveValue).toBe(0)
  })
})
