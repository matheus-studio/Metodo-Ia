import { useCallback, useEffect, useRef, useState } from 'react'
import { repositories } from '@/repositories'
import type { RepositoryKey } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import type { Entity } from '@/types/domain'

interface CollectionState<T> {
  items: T[]
  status: 'carregando' | 'pronto' | 'erro'
  error?: string
  reload: () => void
}

/**
 * Lê uma coleção inteira e se reinscreve no barramento de dados: qualquer tela
 * que grave algo chama `dataBus.emit()` e as demais se atualizam sozinhas.
 */
export function useCollection<T extends Entity>(key: RepositoryKey): CollectionState<T> {
  const [items, setItems] = useState<T[]>([])
  const [status, setStatus] = useState<CollectionState<T>['status']>('carregando')
  const [error, setError] = useState<string | undefined>(undefined)
  const alive = useRef(true)

  const run = useCallback(async () => {
    try {
      const rows = (await repositories[key].list()) as unknown as T[]
      if (!alive.current) return
      setItems(rows)
      setStatus('pronto')
      setError(undefined)
    } catch (cause) {
      if (!alive.current) return
      setStatus('erro')
      setError(cause instanceof Error ? cause.message : 'Falha ao ler os dados locais.')
    }
  }, [key])

  useEffect(() => {
    alive.current = true
    void run()
    const unsubscribe = dataBus.subscribe(() => void run())
    return () => {
      alive.current = false
      unsubscribe()
    }
  }, [run])

  return { items, status, error, reload: () => void run() }
}
