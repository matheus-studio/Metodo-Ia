/** Esqueleto de carregamento: preserva a altura do conteúdo e evita CLS. */
export function PageSkeleton() {
  return (
    <div className="stack" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando a página…</span>
      <div className="skeleton" style={{ height: '2.5rem', width: 'min(22rem, 70%)' }} />
      <div className="skeleton" style={{ height: '11rem' }} />
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="skeleton" style={{ height: '5.5rem' }} />
        <div className="skeleton" style={{ height: '5.5rem' }} />
        <div className="skeleton" style={{ height: '5.5rem' }} />
        <div className="skeleton" style={{ height: '5.5rem' }} />
      </div>
    </div>
  )
}
