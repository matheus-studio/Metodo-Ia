import { useEffect, useState } from 'react'

/** Hora atual, atualizada a cada minuto: virar o dia com a tela aberta muda a meta de hoje. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}
