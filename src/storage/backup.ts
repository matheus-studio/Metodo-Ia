import { repositories } from '@/repositories'
import type { RepositoryKey } from '@/repositories'
import type { Entity } from '@/types/domain'
import { describeIssues, validateCollection } from './backupSchema'
import type { RecordIssue } from './backupSchema'
import { isIndexedDbAvailable, withStores } from './indexedDb'
import type { StoreName } from './types'

export const BACKUP_FORMAT = 'metodo-ia-pro/backup'
export const BACKUP_VERSION = 1

const COLLECTIONS = Object.keys(repositories) as RepositoryKey[]

export interface BackupFile {
  format: typeof BACKUP_FORMAT
  version: number
  exportedAt: string
  collections: Partial<Record<RepositoryKey, Entity[]>>
}

export interface ImportSummary {
  imported: number
  perCollection: Partial<Record<RepositoryKey, number>>
  /** Como a gravação foi feita — a interface precisa dizer isso ao usuário. */
  mode: 'merge' | 'replace'
  atomic: boolean
}

export class BackupValidationError extends Error {
  readonly issues: RecordIssue[]
  constructor(message: string, issues: RecordIssue[] = []) {
    super(message)
    this.name = 'BackupValidationError'
    this.issues = issues
  }
}

export class BackupRestoreError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'BackupRestoreError'
  }
}

export async function exportBackup(): Promise<BackupFile> {
  const collections: Partial<Record<RepositoryKey, Entity[]>> = {}
  for (const key of COLLECTIONS) {
    collections[key] = (await repositories[key].list()) as Entity[]
  }
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), collections }
}

/**
 * Lê e valida o arquivo inteiro antes de qualquer gravação.
 *
 * Política: **tudo ou nada**. Coleção desconhecida é ignorada (pode ser de uma
 * versão mais nova), mas registro malformado dentro de uma coleção conhecida
 * faz o arquivo inteiro ser recusado. Importar "o que deu" deixaria o usuário
 * com um estado que ele não consegue auditar — pior do que não importar.
 */
export function parseBackup(raw: string): BackupFile {
  if (raw.length > 12_000_000) {
    throw new BackupValidationError('Arquivo grande demais para ser um backup do aplicativo.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new BackupValidationError('O arquivo não é um JSON válido.')
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new BackupValidationError('Estrutura de backup não reconhecida.')
  }
  const file = parsed as Record<string, unknown>
  if (file.format !== BACKUP_FORMAT) {
    throw new BackupValidationError('Este arquivo não é um backup do Método IA Pro.')
  }
  if (typeof file.version !== 'number' || file.version > BACKUP_VERSION) {
    throw new BackupValidationError('Backup gerado por uma versão mais nova do aplicativo.')
  }
  if (typeof file.collections !== 'object' || file.collections === null) {
    throw new BackupValidationError('O backup não contém coleções.')
  }

  const source = file.collections as Record<string, unknown>
  const collections: Partial<Record<RepositoryKey, Entity[]>> = {}
  const issues: RecordIssue[] = []

  for (const key of COLLECTIONS) {
    // Só o que é propriedade própria: evita herdar __proto__ e afins.
    if (!Object.hasOwn(source, key)) continue
    const rows = source[key]
    if (!Array.isArray(rows)) {
      throw new BackupValidationError(`A coleção "${key}" não é uma lista.`)
    }
    const collectionIssues = validateCollection(key, rows)
    if (collectionIssues.length > 0) {
      issues.push(...collectionIssues)
      continue
    }
    collections[key] = rows as Entity[]
  }

  if (issues.length > 0) {
    throw new BackupValidationError(
      `Backup recusado: ${issues.length} registro(s) com problema. Nada foi alterado. Detalhes — ${describeIssues(issues)}.`,
      issues,
    )
  }

  if (Object.keys(collections).length === 0) {
    throw new BackupValidationError('O backup não contém nenhuma coleção reconhecida.')
  }

  return {
    format: BACKUP_FORMAT,
    version: file.version,
    exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : new Date().toISOString(),
    collections,
  }
}

/* ------------------------------------------------------ gravação atômica */

function stamp(record: Entity, existingCreatedAt?: string): Entity {
  const now = new Date().toISOString()
  return {
    ...record,
    createdAt: existingCreatedAt ?? record.createdAt ?? now,
    updatedAt: now,
  }
}

/** Caminho IndexedDB: uma transação só; falha em qualquer ponto desfaz tudo. */
async function applyWithTransaction(file: BackupFile, mode: 'merge' | 'replace'): Promise<void> {
  const keys = Object.keys(file.collections) as RepositoryKey[]
  await withStores(keys as StoreName[], 'readwrite', (stores) => {
    for (const key of keys) {
      const store = stores[key]
      if (!store) throw new BackupRestoreError(`Coleção "${key}" indisponível no banco local.`)
      if (mode === 'replace') store.clear()
      for (const record of file.collections[key] ?? []) {
        store.put(stamp(record))
      }
    }
  })
}

/**
 * Caminho sem IndexedDB (aba anônima, armazenamento bloqueado, WebView
 * restrito). Não há transação, então a atomicidade é obtida à mão: tira um
 * retrato de todas as coleções afetadas, aplica, e em caso de erro restaura o
 * retrato. A janela de risco é uma falha *durante a restauração do retrato* —
 * cenário remoto, já que a implementação em memória não faz E/S.
 */
async function applyWithSnapshot(file: BackupFile, mode: 'merge' | 'replace'): Promise<void> {
  const keys = Object.keys(file.collections) as RepositoryKey[]
  const snapshot = new Map<RepositoryKey, Entity[]>()
  for (const key of keys) {
    snapshot.set(key, (await repositories[key].list()) as Entity[])
  }

  try {
    for (const key of keys) {
      const repository = repositories[key] as { clear(): Promise<void>; put(record: Entity): Promise<Entity> }
      if (mode === 'replace') await repository.clear()
      for (const record of file.collections[key] ?? []) {
        await repository.put(stamp(record))
      }
    }
  } catch (error) {
    for (const [key, rows] of snapshot) {
      const repository = repositories[key] as { clear(): Promise<void>; put(record: Entity): Promise<Entity> }
      await repository.clear()
      for (const row of rows) await repository.put(row)
    }
    throw new BackupRestoreError(
      'A restauração falhou e os dados anteriores foram recolocados. Nenhum registro novo foi gravado.',
      { cause: error },
    )
  }
}

/**
 * Restaura o backup.
 *
 * `merge` (padrão) grava por id preservando o que já existe; `replace` apaga as
 * coleções presentes no arquivo antes de gravar. Em ambos os modos a operação é
 * atômica: ou o conjunto inteiro entra, ou nada muda.
 */
export async function importBackup(file: BackupFile, mode: 'merge' | 'replace' = 'merge'): Promise<ImportSummary> {
  const keys = Object.keys(file.collections) as RepositoryKey[]
  const atomic = isIndexedDbAvailable()

  if (atomic) {
    try {
      await applyWithTransaction(file, mode)
    } catch (error) {
      throw new BackupRestoreError(
        'A restauração foi cancelada e nenhuma alteração foi gravada. Seus dados continuam como estavam.',
        { cause: error },
      )
    }
  } else {
    await applyWithSnapshot(file, mode)
  }

  const perCollection: Partial<Record<RepositoryKey, number>> = {}
  let imported = 0
  for (const key of keys) {
    const count = file.collections[key]?.length ?? 0
    perCollection[key] = count
    imported += count
  }

  return { imported, perCollection, mode, atomic }
}

export async function clearAllData(): Promise<void> {
  for (const key of COLLECTIONS) {
    await repositories[key].clear()
  }
}
