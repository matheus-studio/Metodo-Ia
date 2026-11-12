/**
 * Marca do Método IA Pro.
 *
 * Conceito: um M geométrico de traço único em que a diagonal ascendente é a
 * parte acesa e passa um pouco além do topo — o método que sobe e continua.
 * Lê o nome (M de Método) e a promessa (da oportunidade à execução) na mesma
 * forma, sem depender de ícone de radar, gradiente ou brilho.
 *
 * Geometria: traço de peso único sobre grade de 48. Os dois montantes e a
 * primeira diagonal ficam na cor do texto; só a segunda diagonal é âmbar, que
 * é a única cor forte da marca. Funciona a 16 px como ícone de aplicativo.
 */

type MarkProps = {
  size?: number
  title?: string
  /** Ao lado do nome escrito, a marca é decoração: não repete o nome para o leitor de tela. */
  decorative?: boolean
}

export function LogoMark({ size = 32, title = 'Método IA Pro', decorative = false }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-mark"
      {...(decorative ? { 'aria-hidden': true, focusable: false } : { role: 'img', 'aria-label': title })}
    >
      <g strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        {/* Montante esquerdo e descida até o vértice: a parte quieta. */}
        <path d="M10 38V14l14 17" stroke="var(--logo-ink, currentColor)" />
        {/* Montante direito. */}
        <path d="M38 14v24" stroke="var(--logo-ink, currentColor)" />
        {/* Diagonal ascendente, acesa, ultrapassando o topo. */}
        <path d="m24 31 14.5-21.5" stroke="var(--logo-beam, var(--accent))" />
      </g>
    </svg>
  )
}

type LogoProps = Omit<MarkProps, 'decorative'> & {
  /** Oculta o texto — útil na navegação compacta. */
  compact?: boolean
}

export function Logo({ size = 32, compact = false, title }: LogoProps) {
  return (
    <span className="brand-logo" data-compact={compact || undefined}>
      <LogoMark size={size} title={title} decorative={!compact} />
      {!compact && (
        <span className="brand-logo__text">
          Método IA{' '}
          <span className="brand-logo__suffix">Pro</span>
        </span>
      )}
    </span>
  )
}
