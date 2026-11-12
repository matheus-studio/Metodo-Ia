import { useCallback, useEffect, useRef, useState } from 'react'
import { dataBus } from '@/services/dataBus'
import { EMPTY_SNAPSHOT, loadSnapshot } from '@/features/dashboard/snapshot'
import type { WorkspaceSnapshot } from '@/features/dashboard/snapshot'

interface SnapshotState {
  snapshot: WorkspaceSnapshot
  status: 'carregando' | 'pronto' | 'erro'
  error?: string
  reload: () => void
}

export function useSnapshot(): SnapshotState {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(EMPTY_SNAPSHOT)
  const [status, setStatus] = useState<SnapshotState['status']>('carregando')
  const [error, setError] = useState<string | undefined>(undefined)
  const alive = useRef(true)

  const run = useCallback(async () => {
    try {
      const next = await loadSnapshot()
      if (!alive.current) return
      setSnapshot(next)
      setStatus('pronto')
      setError(undefined)
    } catch (cause) {
      if (!alive.current) return
      setStatus('erro')
      setError(cause instanceof Error ? cause.message : 'Falha ao ler os dados locais.')
    }
  }, [])

  useEffect(() => {
    alive.current = true
    void run()
    const unsubscribe = dataBus.subscribe(() => void run())
    return () => {
      alive.current = false
      unsubscribe()
    }
  }, [run])

  return { snapshot, status, error, reload: () => void run() }
}
