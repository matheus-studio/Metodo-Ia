import { STORE_NAMES } from './types'
import type { StoreName } from './types'

export const DB_NAME = 'metodo-ia-pro'
// v2: coleção "prompts" (IA Studio, Marco 5). A migração só cria o que falta,
// então bancos existentes mantêm os dados do usuário.
export const DB_VERSION = 2

let dbPromise: Promise<IDBDatabase> | null = null

export function isIndexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null
  } catch {
    return false
  }
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Falha ao acessar o banco local.'))
  })
}

/**
 * Abre (e migra) o banco local. Uma única promessa é reaproveitada: abrir o
 * IndexedDB a cada operação é um dos custos escondidos mais comuns em WebViews.
 */
export function openDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error('IndexedDB indisponível neste ambiente.'))
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        for (const store of STORE_NAMES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' })
          }
        }
      }
      request.onsuccess = () => {
        const db = request.result
        // Se outra aba subir uma versão nova, soltamos a conexão em vez de travá-la.
        db.onversionchange = () => {
          db.close()
          dbPromise = null
        }
        resolve(db)
      }
      request.onerror = () => reject(request.error ?? new Error('Não foi possível abrir o banco local.'))
      request.onblocked = () => reject(new Error('Banco local bloqueado por outra aba aberta.'))
    })
    dbPromise = dbPromise.catch((error: unknown) => {
      dbPromise = null
      throw error
    })
  }
  return dbPromise
}

export async function withStore<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  run: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const request = run(tx.objectStore(store))
    let result: T
    promisify(request).then(
      (value) => {
        result = value
      },
      (error: unknown) => reject(error),
    )
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error ?? new Error('Transação local falhou.'))
    tx.onabort = () => reject(tx.error ?? new Error('Transação local cancelada.'))
  })
}

/**
 * Executa uma operação sobre várias coleções dentro de **uma única transação**.
 *
 * É o que torna a restauração de backup atômica: se qualquer gravação falhar,
 * a transação é abortada e o IndexedDB desfaz tudo o que havia sido escrito —
 * o usuário fica com os dados anteriores intactos, em vez de metade de cada.
 *
 * `work` recebe os object stores já abertos e deve enfileirar as requisições;
 * a promessa só resolve quando a transação completa de fato.
 */
export async function withStores(
  stores: StoreName[],
  mode: IDBTransactionMode,
  work: (objectStores: Record<string, IDBObjectStore>) => void,
): Promise<void> {
  if (stores.length === 0) return
  const db = await openDatabase()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(stores, mode)
    const objectStores: Record<string, IDBObjectStore> = {}
    for (const store of stores) objectStores[store] = tx.objectStore(store)

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Transação local falhou.'))
    tx.onabort = () => reject(tx.error ?? new Error('Transação local cancelada.'))

    try {
      work(objectStores)
    } catch (error) {
      try {
        tx.abort()
      } catch {
        // A transação pode já ter abortado sozinha; o reject abaixo é o que vale.
      }
      reject(error)
    }
  })
}

/** Usado apenas em testes e ao restaurar um backup. */
export function resetConnection(): void {
  dbPromise = null
}
