/**
 * Modelo de domínio do Método IA Pro.
 *
 * Regra que atravessa todo o modelo: dados criados pelo usuário e dados vindos
 * de fontes externas nunca compartilham o mesmo registro sem marcação de
 * origem. `CompanyLead.source` existe exatamente para isso — uma empresa
 * registrada à mão pode ser persistida livremente; o que vier de um provedor
 * externo obedece à licença da fonte (ver docs/arquitetura.md).
 */

export type ID = string
export type ISODate = string

export interface Entity {
  id: ID
  createdAt: ISODate
  updatedAt: ISODate
}

/** Situação da presença digital — nunca afirma ausência de site como fato. */
export type DigitalPresence =
  | 'site-identificado'
  | 'site-nao-cadastrado'
  | 'site-nao-confirmado'
  | 'presenca-verificada'

export type LeadSource = 'manual' | 'importacao' | 'provedor-externo'

export interface CompanyLead extends Entity {
  name: string
  segment: string
  city: string
  address?: string
  phone?: string
  website?: string
  digitalPresence: DigitalPresence
  source: LeadSource
  /** Identificador na fonte de origem, quando a licença permitir guardá-lo. */
  sourceRef?: string
  sourceName?: string
  checkedAt?: ISODate
  notes?: string
}

export interface SavedOpportunity extends Entity {
  /** Chave do serviço no catálogo (Marco 2). */
  serviceKey: string
  title: string
  segment?: string
  companyId?: ID
  note?: string
}

export type BlueprintStatus = 'rascunho' | 'pronto'

export interface ServiceBlueprint extends Entity {
  name: string
  /** Serviço do catálogo que originou este escopo, quando houver. */
  catalogKey?: string
  problem: string
  audience: string
  deliverables: string[]
  tools: string[]
  steps: string[]
  estimatedHours: number
  risks: string[]
  status: BlueprintStatus
}

export type OfferStatus = 'rascunho' | 'enviada' | 'aceita' | 'recusada'

export interface Offer extends Entity {
  name: string
  clientOrSegment: string
  blueprintId?: ID
  problem?: string
  solution?: string
  /** Por que esta solução vale o que custa, na visão do cliente. */
  valueProposition?: string
  scope?: string
  deliverables: string[]
  price?: number
  currency: 'BRL'
  deadlineDays?: number
  revisions?: number
  /** O que é responsabilidade do cliente (material, acessos, aprovações). */
  clientResponsibilities: string[]
  conditions?: string
  differentials: string[]
  nextSteps: string[]
  callToAction?: string
  status: OfferStatus
}

export interface Contact extends Entity {
  name: string
  companyId?: ID
  phone?: string
  email?: string
  role?: string
  notes?: string
}

export type DealStage = 'novo' | 'contatado' | 'respondeu' | 'proposta' | 'negociacao' | 'fechado' | 'perdido'

export const DEAL_STAGES: readonly DealStage[] = [
  'novo',
  'contatado',
  'respondeu',
  'proposta',
  'negociacao',
  'fechado',
  'perdido',
] as const

export interface Deal extends Entity {
  title: string
  stage: DealStage
  contactId?: ID
  companyId?: ID
  offerId?: ID
  /** Valor potencial informado pelo usuário — nunca estimado pelo sistema. */
  potentialValue?: number
  nextActionAt?: ISODate
  notes?: string
}

export type ProjectStatus = 'briefing' | 'planejamento' | 'execucao' | 'revisao' | 'entregue'

export interface BriefingAnswer {
  question: string
  answer: string
}

export interface ProjectDeliverable {
  id: ID
  title: string
  done: boolean
  /** Aprovação do cliente registrada pelo usuário — não é assinatura digital. */
  approvedAt?: ISODate
}

export interface Project extends Entity {
  name: string
  clientName?: string
  dealId?: ID
  offerId?: ID
  blueprintId?: ID
  status: ProjectStatus
  dueDate?: ISODate
  /** Modelo de briefing escolhido (ver features/projects/briefingTemplates.ts). */
  briefingTemplate?: string
  briefing: BriefingAnswer[]
  deliverables: ProjectDeliverable[]
  notes?: string
}

export interface Task extends Entity {
  title: string
  projectId?: ID
  dealId?: ID
  done: boolean
  dueDate?: ISODate
}

/** Prompt estruturado criado no IA Studio. */
export interface SavedPrompt extends Entity {
  title: string
  category: string
  role: string
  context: string
  goal: string
  inputs: string[]
  method: string[]
  constraints: string[]
  quality: string[]
  outputFormat: string
  review: string
  favorite: boolean
  /** Material da Biblioteca que originou este prompt, quando houver. */
  libraryKey?: string
}

export type ActivityKind =
  | 'oportunidade-salva'
  | 'servico-criado'
  | 'oferta-criada'
  | 'empresa-registrada'
  | 'contato-registrado'
  | 'negociacao-atualizada'
  | 'projeto-atualizado'
  | 'tarefa-concluida'
  | 'dados-importados'
  | 'dados-exportados'
  | 'demo-carregada'
  | 'demo-removida'
  | 'prompt-salvo'

export interface ActivityEntry extends Entity {
  kind: ActivityKind
  message: string
  refId?: ID
}

/** Preferências locais do usuário. Guardadas fora das coleções de negócio. */
export interface UserPreferences {
  theme: 'dark' | 'light' | 'system'
  displayName?: string
  hourlyRate?: number
  weeklyGoalContacts?: number
  skills: string[]
  onboardingDone: boolean
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  skills: [],
  weeklyGoalContacts: 10,
  onboardingDone: false,
}
