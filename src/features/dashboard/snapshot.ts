import { repositories } from '@/repositories'
import { DEAL_STAGES } from '@/types/domain'
import type { ActivityEntry, DealStage, Offer, Task } from '@/types/domain'

export interface SnapshotCounts {
  companies: number
  opportunities: number
  blueprints: number
  offers: number
  contacts: number
  deals: number
  projects: number
  tasks: number
}

export interface WorkspaceSnapshot {
  counts: SnapshotCounts
  dealsByStage: Record<DealStage, number>
  offersByStatus: Record<Offer['status'], number>
  openTasks: Task[]
  overdueTasks: Task[]
  recentActivity: ActivityEntry[]
  /** Contatos registrados nos últimos 7 dias — base da meta semanal. */
  contactsThisWeek: number
  /** Projetos ainda não entregues. */
  openProjects: number
  hasDemoData: boolean
  loadedAt: string
}

export const EMPTY_SNAPSHOT: WorkspaceSnapshot = {
  counts: {
    companies: 0,
    opportunities: 0,
    blueprints: 0,
    offers: 0,
    contacts: 0,
    deals: 0,
    projects: 0,
    tasks: 0,
  },
  dealsByStage: {
    novo: 0,
    contatado: 0,
    respondeu: 0,
    proposta: 0,
    negociacao: 0,
    fechado: 0,
    perdido: 0,
  },
  offersByStatus: { rascunho: 0, enviada: 0, aceita: 0, recusada: 0 },
  openTasks: [],
  overdueTasks: [],
  recentActivity: [],
  contactsThisWeek: 0,
  openProjects: 0,
  hasDemoData: false,
  loadedAt: '',
}

const DAY_MS = 86_400_000

/**
 * Uma leitura por coleção, agregada em memória. O volume local é pequeno nesta
 * etapa; quando passar a valer a pena, a contagem vira índice no repositório
 * sem mudar o formato consumido pela interface.
 */
export async function loadSnapshot(reference: Date = new Date()): Promise<WorkspaceSnapshot> {
  const [companies, opportunities, blueprints, offers, contacts, deals, projects, tasks, activity] = await Promise.all([
    repositories.companies.list(),
    repositories.opportunities.list(),
    repositories.blueprints.list(),
    repositories.offers.list(),
    repositories.contacts.list(),
    repositories.deals.list(),
    repositories.projects.list(),
    repositories.tasks.list(),
    repositories.activity.list(),
  ])

  const dealsByStage = { ...EMPTY_SNAPSHOT.dealsByStage }
  for (const deal of deals) {
    if (DEAL_STAGES.includes(deal.stage)) dealsByStage[deal.stage] += 1
  }

  const offersByStatus = { ...EMPTY_SNAPSHOT.offersByStatus }
  for (const offer of offers) {
    offersByStatus[offer.status] += 1
  }

  const openTasks = tasks
    .filter((task) => !task.done)
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))

  const todayIso = reference.toISOString().slice(0, 10)
  const weekAgo = new Date(reference.getTime() - 7 * DAY_MS).toISOString()

  return {
    counts: {
      companies: companies.length,
      opportunities: opportunities.length,
      blueprints: blueprints.length,
      offers: offers.length,
      contacts: contacts.length,
      deals: deals.length,
      projects: projects.length,
      tasks: tasks.length,
    },
    dealsByStage,
    offersByStatus,
    openTasks: openTasks.slice(0, 6),
    overdueTasks: openTasks.filter((task) => task.dueDate !== undefined && task.dueDate < todayIso),
    recentActivity: [...activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    contactsThisWeek: contacts.filter((contact) => contact.createdAt >= weekAgo).length,
    openProjects: projects.filter((project) => project.status !== 'entregue').length,
    // Registros de demonstração usam o prefixo "demo-" no id (ver services/demoData.ts).
    hasDemoData: [...companies, ...deals, ...offers].some((row) => row.id.startsWith('demo-')),
    loadedAt: reference.toISOString(),
  }
}
