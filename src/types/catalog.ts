/** Catálogo de serviços — conteúdo estático, versionado com o código. */

export type Complexity = 'iniciante' | 'intermediario' | 'avancado'

export type CatalogCategory =
  | 'sites'
  | 'conteudo'
  | 'video'
  | 'texto'
  | 'marca'
  | 'vendas'
  | 'operacao'
  | 'pesquisa'

export interface PricingModel {
  /** Como se cobra — nunca quanto. Preço é decisão do usuário, não do app. */
  label: string
  note: string
}

export interface CatalogService {
  key: string
  name: string
  category: CatalogCategory
  /** Uma linha: o que é o serviço. */
  summary: string
  /** O problema concreto do cliente que esse serviço resolve. */
  problem: string
  audience: string
  /** Segmentos onde esse serviço costuma fazer sentido. */
  segments: string[]
  complexity: Complexity
  tools: string[]
  skills: string[]
  deliverables: string[]
  /** Faixa de horas de execução, do cenário simples ao completo. */
  hours: [number, number]
  pricing: PricingModel[]
  risks: string[]
  plan: string[]
  /** Abordagem sugerida — ponto de partida para edição, nunca envio automático. */
  pitch: string
}

export const CATEGORY_LABELS: Record<CatalogCategory, string> = {
  sites: 'Sites e páginas',
  conteudo: 'Redes e conteúdo',
  video: 'Vídeo',
  texto: 'Texto e copy',
  marca: 'Marca e material',
  vendas: 'Vendas e atendimento',
  operacao: 'Operação e automação',
  pesquisa: 'Pesquisa e diagnóstico',
}

export const COMPLEXITY_LABELS: Record<Complexity, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}
