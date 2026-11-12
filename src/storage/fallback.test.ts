import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Entity } from '@/types/domain'

/**
 * Comportamento quando o IndexedDB não está disponível — janela anônima,
 * armazenamento bloqueado pelo navegador, WebView restrito.
 *
 * Duas garantias são testadas aqui: o usuário é avisado de que os dados não vão
 * persistir, e a restauração de backup continua sendo tudo ou nada mesmo sem
 * transação de banco.
 */

vi.mock('./indexedDb', async (importOriginal) => {
  const original = await importOriginal<typeof import('./indexedDb')>()
  return { ...original, isIndexedDbAvailable: () => false }
})

const { repositories } = await import('@/repositories')
const { BackupRestoreError, importBackup } = await import('./backup')
const {
  getStorageHealth,
  isQuotaError,
  reportStorageFailure,
  resetStorageHealth,
  setStorageHealth,
  subscribeStorageHealth,
} = await import('./storageHealth')

beforeEach(async () => {
  for (const repository of Object.values(repositories)) await repository.clear()
})

describe('sem IndexedDB', () => {
  it('ainda assim grava e lê, para o usuário não perder o que digitou', async () => {
    const criado = await repositories.contacts.create({ name: 'Contato em memória' })
    expect((await repositories.contacts.get(criado.id))?.name).toBe('Contato em memória')
  })

  it('restaura o backup e informa que a gravação não foi atômica', async () => {
    const summary = await importBackup(
      {
        format: 'metodo-ia-pro/backup',
        version: 1,
        exportedAt: new Date().toISOString(),
        collections: { tasks: [{ id: 't1', title: 'Tarefa', done: false, createdAt: '', updatedAt: '' } as Entity] },
      },
      'replace',
    )
    expect(summary.imported).toBe(1)
    expect(summary.atomic).toBe(false)
  })

  it('recoloca os dados anteriores se a restauração falhar no meio', async () => {
    await repositories.tasks.create({ title: 'Tarefa original', done: false })
    const antes = await repositories.tasks.list()

    const put = vi.spyOn(repositories.tasks, 'put').mockRejectedValueOnce(new Error('falha simulada de gravação'))

    await expect(
      importBackup(
        {
          format: 'metodo-ia-pro/backup',
          version: 1,
          exportedAt: new Date().toISOString(),
          collections: { tasks: [{ id: 'nova', title: 'Tarefa nova', done: false, createdAt: '', updatedAt: '' } as Entity] },
        },
        'replace',
      ),
    ).rejects.toBeInstanceOf(BackupRestoreError)

    put.mockRestore()
    const depois = await repositories.tasks.list()
    expect(depois).toHaveLength(1)
    expect(depois[0]?.title).toBe(antes[0]?.title)
  })
})

describe('classificação de falhas de armazenamento', () => {
  it('reconhece falta de espaço e separa de outras falhas', () => {
    resetStorageHealth()
    const cota = new DOMException('quota', 'QuotaExceededError')
    expect(isQuotaError(cota)).toBe(true)

    reportStorageFailure(cota)
    expect(getStorageHealth().mode).toBe('sem-espaco')

    resetStorageHealth()
    reportStorageFailure(new Error('banco bloqueado'))
    expect(getStorageHealth().mode).toBe('memoria')
  })

  it('notifica quem estiver observando', () => {
    resetStorageHealth()
    const visto: string[] = []
    const unsubscribe = subscribeStorageHealth((health) => visto.push(health.mode))
    setStorageHealth('persistente')
    setStorageHealth('memoria', 'teste')
    unsubscribe()
    setStorageHealth('persistente')
    expect(visto).toEqual(['persistente', 'memoria'])
  })
})
