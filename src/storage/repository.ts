import type { Entity, ID } from '@/types/domain'
import { isIndexedDbAvailable, withStore } from './indexedDb'
import { getStorageHealth, reportStorageFailure, setStorageHealth } from './storageHealth'
import { RecordNotFoundError } from './types'
import type { NewRecord, Repository, StoreName } from './types'

export function newId(): ID {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function now(): string {
  return new Date().toISOString()
}

function stamp<T extends Entity>(input: NewRecord<T>): T {
  const timestamp = now()
  return { ...(input as object), id: input.id ?? newId(), createdAt: timestamp, updatedAt: timestamp } as T
}

/** Implementação em memória: fallback quando o IndexedDB não está disponível. */
export function createMemoryRepository<T extends Entity>(store: StoreName): Repository<T> {
  const rows = new Map<ID, T>()
  return {
    store,
    async list() {
      return [...rows.values()]
    },
    async get(id) {
      return rows.get(id)
    },
    async create(input) {
      const record = stamp<T>(input)
      rows.set(record.id, record)
      return record
    },
    async update(id, patch) {
      const current = rows.get(id)
      if (!current) throw new RecordNotFoundError(store, id)
      const next = { ...current, ...patch, id, createdAt: current.createdAt, updatedAt: now() } as T
      rows.set(id, next)
      return next
    },
    async put(record) {
      const current = rows.get(record.id)
      const next = { ...record, createdAt: current?.createdAt ?? record.createdAt, updatedAt: now() }
      rows.set(record.id, next)
      return next
    },
    async remove(id) {
      rows.delete(id)
    },
    async clear() {
      rows.clear()
    },
    async count() {
      return rows.size
    },
  }
}

function createIdbRepository<T extends Entity>(store: StoreName): Repository<T> {
  return {
    store,
    list() {
      return withStore<T[]>(store, 'readonly', (os) => os.getAll() as IDBRequest<T[]>)
    },
    get(id) {
      return withStore<T | undefined>(store, 'readonly', (os) => os.get(id) as IDBRequest<T | undefined>)
    },
    async create(input) {
      const record = stamp<T>(input)
      await withStore(store, 'readwrite', (os) => os.add(record))
      return record
    },
    async update(id, patch) {
      const current = await this.get(id)
      if (!current) throw new RecordNotFoundError(store, id)
      const next = { ...current, ...patch, id, createdAt: current.createdAt, updatedAt: now() } as T
      await withStore(store, 'readwrite', (os) => os.put(next))
      return next
    },
    async put(record) {
      const current = await this.get(record.id)
      const next = { ...record, createdAt: current?.createdAt ?? record.createdAt, updatedAt: now() }
      await withStore(store, 'readwrite', (os) => os.put(next))
      return next
    },
    async remove(id) {
      await withStore(store, 'readwrite', (os) => os.delete(id))
    },
    async clear() {
      await withStore(store, 'readwrite', (os) => os.clear())
    },
    count() {
      return withStore<number>(store, 'readonly', (os) => os.count())
    },
  }
}

/**
 * Repositório resiliente.
 *
 * Usa IndexedDB quando ele existe e funciona. Se uma operação falhar — banco
 * bloqueado, armazenamento desligado, cota estourada —, a operação é refeita em
 * memória para que o usuário não perca o que acabou de digitar, **e** o estado
 * global de armazenamento passa a "memória", o que faz a interface exibir o
 * aviso de que os dados não vão sobreviver ao fechamento. Em nenhuma hipótese a
 * falha é engolida em silêncio: perder dado sem avisar é o pior desfecho.
 */
export function createRepository<T extends Entity>(store: StoreName): Repository<T> {
  const memory = createMemoryRepository<T>(store)
  if (!isIndexedDbAvailable()) {
    setStorageHealth('memoria', 'Este navegador não disponibiliza armazenamento local (IndexedDB).')
    return memory
  }

  const idb = createIdbRepository<T>(store)
  let degraded = false

  async function run<R>(viaIdb: () => Promise<R>, viaMemory: () => Promise<R>): Promise<R> {
    if (degraded) return viaMemory()
    try {
      const result = await viaIdb()
      // Sucesso confirma que a persistência está de pé.
      if (getStorageHealth().mode === 'verificando') setStorageHealth('persistente')
      return result
    } catch (error) {
      if (error instanceof RecordNotFoundError) throw error
      degraded = true
      reportStorageFailure(error)
      return viaMemory()
    }
  }

  return {
    store,
    list: () => run(() => idb.list(), () => memory.list()),
    get: (id) => run(() => idb.get(id), () => memory.get(id)),
    create: (input) => run(() => idb.create(input), () => memory.create(input)),
    update: (id, patch) => run(() => idb.update(id, patch), () => memory.update(id, patch)),
    put: (record) => run(() => idb.put(record), () => memory.put(record)),
    remove: (id) => run(() => idb.remove(id), () => memory.remove(id)),
    clear: () => run(() => idb.clear(), () => memory.clear()),
    count: () => run(() => idb.count(), () => memory.count()),
  }
}
