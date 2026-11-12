import { DEAL_STAGES } from '@/types/domain'
import type { Deal, DealStage } from '@/types/domain'

export const STAGE_LABELS: Record<DealStage, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  respondeu: 'Respondeu',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  fechado: 'Fechado',
  perdido: 'Perdido',
}

export const STAGE_HELP: Record<DealStage, string> = {
  novo: 'Registrado, ainda sem contato feito.',
  contatado: 'Você enviou a abordagem e aguarda retorno.',
  respondeu: 'Houve resposta — é a hora de propor.',
  proposta: 'Proposta enviada, aguardando decisão.',
  negociacao: 'Ajustando escopo, preço ou prazo.',
  fechado: 'Negócio ganho.',
  perdido: 'Encerrado sem fechamento.',
}

/** Estágios ativos, na ordem do funil. Fechado e perdido são finais. */
export const ACTIVE_STAGES: DealStage[] = ['novo', 'contatado', 'respondeu', 'proposta', 'negociacao']

export function nextStage(stage: DealStage): DealStage | null {
  if (stage === 'fechado' || stage === 'perdido') return null
  const index = ACTIVE_STAGES.indexOf(stage)
  if (index === -1) return null
  return index === ACTIVE_STAGES.length - 1 ? 'fechado' : (ACTIVE_STAGES[index + 1] ?? null)
}

export interface DealFilter {
  text?: string
  stages?: DealStage[]
  /** Quando falso, oculta negociações já encerradas. */
  includeClosed?: boolean
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function filterDeals(deals: Deal[], filter: DealFilter): Deal[] {
  const text = filter.text ? normalize(filter.text.trim()) : ''
  return deals.filter((deal) => {
    if (!filter.includeClosed && (deal.stage === 'fechado' || deal.stage === 'perdido')) return false
    if (filter.stages && filter.stages.length > 0 && !filter.stages.includes(deal.stage)) return false
    if (!text) return true
    return normalize(`${deal.title} ${deal.notes ?? ''}`).includes(text)
  })
}

export interface PipelineSummary {
  byStage: Record<DealStage, number>
  active: number
  closed: number
  lost: number
  /**
   * Soma dos valores potenciais informados pelo usuário nas negociações
   * ativas. Não é previsão de receita: não há probabilidade por estágio aqui,
   * porque não existe base histórica para calcular uma.
   */
  declaredActiveValue: number
  dealsWithoutValue: number
}

export function summarizePipeline(deals: Deal[]): PipelineSummary {
  const byStage = DEAL_STAGES.reduce(
    (accumulator, stage) => ({ ...accumulator, [stage]: 0 }),
    {} as Record<DealStage, number>,
  )

  let declaredActiveValue = 0
  let dealsWithoutValue = 0

  for (const deal of deals) {
    byStage[deal.stage] += 1
    const isActive = ACTIVE_STAGES.includes(deal.stage)
    if (isActive) {
      if (deal.potentialValue === undefined) dealsWithoutValue += 1
      else declaredActiveValue += deal.potentialValue
    }
  }

  return {
    byStage,
    active: ACTIVE_STAGES.reduce((total, stage) => total + byStage[stage], 0),
    closed: byStage.fechado,
    lost: byStage.perdido,
    declaredActiveValue,
    dealsWithoutValue,
  }
}
