/**
 * Saúde do armazenamento local.
 *
 * O aplicativo guarda tudo no aparelho. Se o IndexedDB estiver indisponível
 * (janela anônima, armazenamento bloqueado, WebView restrito) ou se o espaço
 * acabar, o usuário **precisa saber** — caso contrário ele cadastra clientes a
 * manhã inteira, fecha o navegador e perde o trabalho, tendo visto "salvo" em
 * cada passo. Este módulo centraliza esse estado para a interface avisar.
 */

export type StorageMode =
  /** IndexedDB funcionando: os dados sobrevivem ao fechamento do navegador. */
  | 'persistente'
  /** Sem IndexedDB: os dados existem só nesta aba, até ela ser fechada. */
  | 'memoria'
  /** Gravação recusada por falta de espaço. */
  | 'sem-espaco'
  | 'verificando'

export interface StorageHealth {
  mode: StorageMode
  /** Detalhe técnico do problema, quando houver. */
  detail?: string
}

let current: StorageHealth = { mode: 'verificando' }
const listeners = new Set<(health: StorageHealth) => void>()

export function getStorageHealth(): StorageHealth {
  return current
}

export function subscribeStorageHealth(listener: (health: StorageHealth) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setStorageHealth(mode: StorageMode, detail?: string): void {
  if (current.mode === mode && current.detail === detail) return
  current = detail === undefined ? { mode } : { mode, detail }
  for (const listener of listeners) listener(current)
}

/** Reconhece falta de espaço entre os erros do IndexedDB. */
export function isQuotaError(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
  }
  return error instanceof Error && /quota/i.test(error.message)
}

/** Classifica um erro de gravação e atualiza o estado global. */
export function reportStorageFailure(error: unknown): void {
  if (isQuotaError(error)) {
    setStorageHealth('sem-espaco', 'O armazenamento do navegador está cheio.')
    return
  }
  setStorageHealth('memoria', error instanceof Error ? error.message : 'Falha ao acessar o banco local.')
}

/** Usado em testes para voltar ao estado inicial. */
export function resetStorageHealth(): void {
  current = { mode: 'verificando' }
}
