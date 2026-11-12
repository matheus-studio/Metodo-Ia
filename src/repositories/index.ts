import { createRepository } from '@/storage/repository'
import type { Repository } from '@/storage/types'
import type {
  ActivityEntry,
  CompanyLead,
  Contact,
  Deal,
  Entity,
  Offer,
  Project,
  SavedOpportunity,
  SavedPrompt,
  ServiceBlueprint,
  Task,
} from '@/types/domain'

/**
 * Registro central de coleções. Todo acesso a dados passa por aqui — nenhum
 * componente conhece IndexedDB diretamente, o que mantém a migração futura
 * para um banco remoto restrita a esta camada.
 */
export const repositories = {
  companies: createRepository<CompanyLead>('companies'),
  opportunities: createRepository<SavedOpportunity>('opportunities'),
  blueprints: createRepository<ServiceBlueprint>('blueprints'),
  offers: createRepository<Offer>('offers'),
  contacts: createRepository<Contact>('contacts'),
  deals: createRepository<Deal>('deals'),
  projects: createRepository<Project>('projects'),
  tasks: createRepository<Task>('tasks'),
  prompts: createRepository<SavedPrompt>('prompts'),
  activity: createRepository<ActivityEntry>('activity'),
} as const

export type RepositoryKey = keyof typeof repositories

export function repositoryFor(key: RepositoryKey): Repository<Entity> {
  return repositories[key] as Repository<Entity>
}

/** Registra uma atividade sem derrubar a ação principal se a gravação falhar. */
export async function logActivity(entry: Pick<ActivityEntry, 'kind' | 'message'> & { refId?: string }): Promise<void> {
  try {
    await repositories.activity.create(entry)
  } catch {
    // Histórico é informativo: uma falha aqui não deve interromper o fluxo.
  }
}
