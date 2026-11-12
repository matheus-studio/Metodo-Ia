import { useEffect, useState } from 'react'
import { getStorageHealth, setStorageHealth, subscribeStorageHealth } from '@/storage/storageHealth'
import type { StorageHealth } from '@/storage/storageHealth'
import { repositories } from '@/repositories'

/**
 * Observa o estado do armazenamento e dispara uma sondagem na primeira vez.
 *
 * A sondagem é uma leitura real (`count()` numa coleção pequena): é o único
 * jeito de saber se o IndexedDB responde neste navegador — `typeof indexedDB`
 * continua definido em janelas anônimas que recusam a abertura do banco.
 */
export function useStorageHealth(): StorageHealth {
  const [health, setHealth] = useState<StorageHealth>(() => getStorageHealth())

  useEffect(() => {
    const unsubscribe = subscribeStorageHealth(setHealth)
    if (getStorageHealth().mode === 'verificando') {
      void repositories.activity
        .count()
        .then(() => {
          if (getStorageHealth().mode === 'verificando') setStorageHealth('persistente')
        })
        .catch(() => {
          // O próprio repositório já classifica e reporta a falha.
        })
    }
    return unsubscribe
  }, [])

  return health
}

export const STORAGE_MESSAGES: Record<StorageHealth['mode'], string | null> = {
  verificando: null,
  persistente: null,
  memoria:
    'Este navegador não está guardando os dados no aparelho. O que você registrar agora existe apenas nesta aba e some ao fechá-la. Exporte um backup antes de sair.',
  'sem-espaco':
    'O armazenamento do navegador está cheio. Novos registros podem não ser gravados. Exporte um backup e libere espaço nas configurações do navegador.',
}
