import type { Entity, ID } from '@/types/domain'

export const STORE_NAMES = [
  'companies',
  'opportunities',
  'blueprints',
  'offers',
  'contacts',
  'deals',
  'projects',
  'tasks',
  'prompts',
  'activity',
  'settings',
] as const

export type StoreName = (typeof STORE_NAMES)[number]

/** Campos gerados pela camada de persistência, não pelo chamador. */
export type NewRecord<T extends Entity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<T, 'id'>>

export interface Repository<T extends Entity> {
  readonly store: StoreName
  list(): Promise<T[]>
  get(id: ID): Promise<T | undefined>
  create(input: NewRecord<T>): Promise<T>
  update(id: ID, patch: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T>
  /** Grava o registro completo preservando createdAt quando já existir. */
  put(record: T): Promise<T>
  remove(id: ID): Promise<void>
  clear(): Promise<void>
  count(): Promise<number>
}

export class RecordNotFoundError extends Error {
  constructor(store: StoreName, id: ID) {
    super(`Registro ${id} não encontrado em "${store}".`)
    this.name = 'RecordNotFoundError'
  }
}
