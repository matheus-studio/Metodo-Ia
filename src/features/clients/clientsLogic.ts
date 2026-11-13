import { buildMessage } from '@/features/prospecting/messageTemplates'
import type { Channel } from '@/features/prospecting/messageTemplates'
import type { CatalogService } from '@/types/catalog'
import type { CompanyLead, Deal, DealStage, DigitalPresence } from '@/types/domain'

/**
 * Lógica da tela Clientes: buscas guiadas, fila de abordagem e retornos.
 * Nada aqui acessa a internet nem envia mensagem — gera links que o próprio
 * usuário abre, em fontes públicas, e textos que o próprio usuário envia.
 */

/* ---------------------------------------------------------------- buscas */

export interface Ramo {
  key: string
  label: string
  /** Termos que o dono do negócio reconhece, usados na busca. */
  terms: string[]
}

export const RAMOS: readonly Ramo[] = [
  { key: 'alimentacao', label: 'Alimentação', terms: ['restaurante', 'lanchonete', 'padaria', 'pizzaria', 'hamburgueria', 'confeitaria'] },
  { key: 'beleza', label: 'Beleza', terms: ['salão de beleza', 'barbearia', 'clínica de estética', 'esmalteria', 'studio de sobrancelha'] },
  { key: 'saude', label: 'Saúde e bem-estar', terms: ['academia', 'fisioterapia', 'nutricionista', 'psicólogo', 'pilates', 'massoterapia'] },
  { key: 'clinicas', label: 'Clínicas', terms: ['clínica odontológica', 'dentista', 'clínica veterinária', 'clínica de estética', 'laboratório'] },
  { key: 'pet', label: 'Pet', terms: ['pet shop', 'banho e tosa', 'clínica veterinária', 'hotel para cães'] },
  { key: 'educacao', label: 'Educação', terms: ['escola de idiomas', 'reforço escolar', 'escola de música', 'curso profissionalizante', 'creche'] },
  { key: 'varejo', label: 'Lojas e varejo', terms: ['loja de roupas', 'papelaria', 'loja de calçados', 'floricultura', 'loja de presentes', 'material de construção'] },
  { key: 'casa', label: 'Serviços para casa', terms: ['eletricista', 'encanador', 'chaveiro', 'marceneiro', 'dedetizadora', 'lavanderia'] },
  { key: 'auto', label: 'Automotivo', terms: ['oficina mecânica', 'lava jato', 'auto elétrica', 'funilaria', 'autopeças'] },
  { key: 'imoveis', label: 'Imobiliário e construção', terms: ['imobiliária', 'corretor de imóveis', 'construtora', 'arquiteto', 'engenheiro civil'] },
  { key: 'eventos', label: 'Eventos', terms: ['buffet', 'fotógrafo', 'decoração de festas', 'cerimonial', 'espaço para eventos'] },
  { key: 'escritorios', label: 'Escritórios e profissionais', terms: ['contabilidade', 'advogado', 'despachante', 'consultoria', 'escritório de engenharia'] },
]

/** Quais ramos combinam com os segmentos citados no catálogo de um serviço. */
const SEGMENT_TO_RAMOS: Record<string, string[]> = {
  Alimentação: ['alimentacao'],
  'Saúde e bem-estar': ['saude', 'clinicas'],
  Beleza: ['beleza'],
  Clínicas: ['clinicas'],
  Pet: ['pet'],
  Educação: ['educacao'],
  Varejo: ['varejo'],
  Moda: ['varejo'],
  Comércio: ['varejo'],
  Papelaria: ['varejo'],
  Imobiliário: ['imoveis'],
  Construção: ['imoveis'],
  'Materiais de construção': ['varejo', 'imoveis'],
  Eventos: ['eventos'],
  'Serviços gerais': ['casa', 'auto'],
  Escritórios: ['escritorios'],
  Consultoria: ['escritorios'],
  Autônomos: ['escritorios', 'casa'],
}

export function suggestedRamos(service: CatalogService | undefined): string[] {
  if (!service) return []
  const keys = new Set<string>()
  for (const segment of service.segments) {
    for (const key of SEGMENT_TO_RAMOS[segment] ?? []) keys.add(key)
  }
  return [...keys]
}

export interface SearchLinks {
  maps: string
  google: string
  instagram: string
}

/** Links de busca em fontes públicas. O usuário abre, olha e decide. */
export function searchLinks(term: string, city: string): SearchLinks {
  const where = city.trim()
  const subject = where ? `${term.trim()} em ${where}` : term.trim()
  return {
    maps: `https://www.google.com/maps/search/${encodeURIComponent(subject)}`,
    google: `https://www.google.com/search?q=${encodeURIComponent(subject)}`,
    instagram: `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com ${subject}`)}`,
  }
}

/* ---------------------------------------------------------------- site */

export type SiteCheck = 'tem' | 'nao-achei' | 'nao-verifiquei'

export const SITE_CHECK_LABELS: Record<SiteCheck, string> = {
  tem: 'Tem site',
  'nao-achei': 'Pesquisei e não achei site',
  'nao-verifiquei': 'Ainda não verifiquei',
}

/**
 * "Não achei" não é "não tem": a presença digital guarda exatamente o que foi
 * conferido, para a mensagem nunca afirmar o que ninguém verificou.
 */
export function presenceFor(check: SiteCheck): DigitalPresence {
  if (check === 'tem') return 'site-identificado'
  if (check === 'nao-achei') return 'site-nao-cadastrado'
  return 'site-nao-confirmado'
}

/* ---------------------------------------------------------------- fila */

export type Etapa = 'novo' | 'contatado' | 'respondeu' | 'proposta' | 'fechado' | 'perdido'

export const ETAPAS: readonly Etapa[] = ['novo', 'contatado', 'respondeu', 'proposta', 'fechado', 'perdido']

export const ETAPA_LABELS: Record<Etapa, string> = {
  novo: 'Para abordar',
  contatado: 'Aguardando',
  respondeu: 'Responderam',
  proposta: 'Proposta',
  fechado: 'Fechados',
  perdido: 'Sem retorno',
}

export function etapaOf(stage: DealStage): Etapa {
  if (stage === 'negociacao') return 'proposta'
  return stage
}

export function isEtapa(value: string | null): value is Etapa {
  return value !== null && (ETAPAS as readonly string[]).includes(value)
}

export interface Lead {
  deal: Deal
  company?: CompanyLead
  name: string
}

export function buildLeads(deals: Deal[], companies: CompanyLead[]): Lead[] {
  const byId = new Map(companies.map((company) => [company.id, company]))
  return deals
    .map((deal) => {
      const company = deal.companyId ? byId.get(deal.companyId) : undefined
      return { deal, company, name: company?.name ?? deal.title }
    })
    .sort((a, b) => b.deal.updatedAt.localeCompare(a.deal.updatedAt))
}

export const FOLLOWUP_AFTER_DAYS = 2
const DAY_MS = 86_400_000

export function followupAt(now: Date, days = FOLLOWUP_AFTER_DAYS): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString()
}

export function isFollowupDue(deal: Deal, now: Date): boolean {
  if (deal.stage !== 'contatado') return false
  const due = deal.nextActionAt ? Date.parse(deal.nextActionAt) : Date.parse(deal.updatedAt) + FOLLOWUP_AFTER_DAYS * DAY_MS
  return Number.isFinite(due) && due <= now.getTime()
}

export function daysSince(iso: string, now: Date): number {
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) return 0
  return Math.max(0, Math.floor((now.getTime() - then) / DAY_MS))
}

export interface PipelineCounts {
  novos: number
  aguardando: number
  responderam: number
  propostas: number
  fechados: number
  retornosDevidos: number
  valorFechado: number
}

export function countPipeline(deals: Deal[], now: Date): PipelineCounts {
  const counts: PipelineCounts = {
    novos: 0,
    aguardando: 0,
    responderam: 0,
    propostas: 0,
    fechados: 0,
    retornosDevidos: 0,
    valorFechado: 0,
  }
  for (const deal of deals) {
    switch (etapaOf(deal.stage)) {
      case 'novo':
        counts.novos += 1
        break
      case 'contatado':
        counts.aguardando += 1
        if (isFollowupDue(deal, now)) counts.retornosDevidos += 1
        break
      case 'respondeu':
        counts.responderam += 1
        break
      case 'proposta':
        counts.propostas += 1
        break
      case 'fechado':
        counts.fechados += 1
        counts.valorFechado += deal.potentialValue ?? 0
        break
      default:
        break
    }
  }
  return counts
}

/* ---------------------------------------------------------------- mensagem */

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

export function draftFor(options: {
  lead: Lead
  service: CatalogService | undefined
  senderName?: string
  channel: Channel
  now: Date
}): { subject?: string; body: string; warnings: string[] } {
  const { lead, service, senderName, channel, now } = options
  const observation = lead.company?.notes?.trim()
  return buildMessage(channel, 'consultivo', {
    senderName,
    companyName: lead.company?.name ?? lead.name,
    serviceName: service ? lowerFirst(service.name) : undefined,
    benefit: service ? lowerFirst(service.summary).replace(/\.$/, '') : undefined,
    // A observação só entra se o usuário a escreveu ao salvar o negócio.
    verifiedObservation: channel === 'followup' ? undefined : observation || undefined,
    daysSinceContact: channel === 'followup' ? daysSince(lead.deal.updatedAt, now) : undefined,
  })
}
