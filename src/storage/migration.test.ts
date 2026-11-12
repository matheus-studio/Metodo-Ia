import { afterEach, describe, expect, it } from 'vitest'
import { DB_NAME, DB_VERSION, openDatabase, resetConnection } from './indexedDb'
import { STORE_NAMES } from './types'

/**
 * Migração do banco local.
 *
 * Quando a coleção "prompts" entrou (Marco 5), a versão subiu de 1 para 2.
 * Este teste simula um banco gravado pela versão antiga e verifica que a
 * abertura cria só o que falta, sem tocar no que o usuário já tinha — é o
 * cenário de quem já usava o aplicativo e recebeu a atualização.
 */

function deleteDatabase(): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}

/** Cria um banco no formato da versão 1: todas as coleções menos "prompts". */
function createLegacyDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      for (const store of STORE_NAMES) {
        if (store === 'prompts') continue
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction('companies', 'readwrite')
      tx.objectStore('companies').put({
        id: 'legada-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        name: 'Empresa cadastrada antes da atualização',
        segment: 'Serviços',
        city: 'Curitiba',
        digitalPresence: 'site-nao-confirmado',
        source: 'manual',
      })
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => reject(tx.error)
    }
    request.onerror = () => reject(request.error)
  })
}

afterEach(async () => {
  resetConnection()
  await deleteDatabase()
})

describe('migração do banco local', () => {
  it('abre um banco da versão antiga, cria a coleção nova e preserva os dados', async () => {
    resetConnection()
    await deleteDatabase()
    await createLegacyDatabase()
    resetConnection()

    const db = await openDatabase()

    expect(db.version).toBe(DB_VERSION)
    expect(db.objectStoreNames.contains('prompts')).toBe(true)

    const existing = await new Promise((resolve, reject) => {
      const tx = db.transaction('companies', 'readonly')
      const request = tx.objectStore('companies').get('legada-1')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    expect((existing as { name: string }).name).toBe('Empresa cadastrada antes da atualização')
  })

  it('cria todas as coleções declaradas em um banco novo', async () => {
    resetConnection()
    await deleteDatabase()

    const db = await openDatabase()
    for (const store of STORE_NAMES) {
      expect(db.objectStoreNames.contains(store)).toBe(true)
    }
  })
})
