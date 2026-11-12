type Listener = () => void

const listeners = new Set<Listener>()

/**
 * Canal mínimo de invalidação. Quando uma tela grava algo, avisa as demais
 * para recarregarem — evita um store global e mantém cada módulo independente.
 */
export const dataBus = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  emit(): void {
    for (const listener of listeners) listener()
  },
}
