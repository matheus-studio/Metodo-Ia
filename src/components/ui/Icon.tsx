/**
 * Conjunto de ícones próprio, desenhado em grade de 24px com traço de 1.6.
 * Decisão: em vez de uma biblioteca de ícones (dezenas de kB e um estilo de
 * terceiros), são ~25 paths inline — custo próximo de zero e coerência visual.
 */

export type IconName =
  | 'dashboard'
  | 'radar'
  | 'compass'
  | 'building'
  | 'blueprint'
  | 'offer'
  | 'message'
  | 'pipeline'
  | 'project'
  | 'calculator'
  | 'spark'
  | 'book'
  | 'academy'
  | 'target'
  | 'settings'
  | 'map'
  | 'chevron-right'
  | 'arrow-right'
  | 'plus'
  | 'download'
  | 'upload'
  | 'trash'
  | 'check'
  | 'alert'
  | 'info'
  | 'sun'
  | 'moon'
  | 'menu'
  | 'close'
  | 'search'
  | 'clock'

const paths: Record<IconName, string> = {
  dashboard: 'M4 4h7v6H4zM4 14h7v6H4zM14 4h6v10h-6zM14 18h6v2h-6z',
  radar: 'M12 12 19 6M12 21a9 9 0 1 1 8.5-12M12 16.5a4.5 4.5 0 1 1 3.6-7.2M19 7.5h2.5V5',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
  building: 'M4 21V6l7-3v18M11 21h9V10l-9-3M7 10h1M7 14h1M15 13h1M15 17h1M4 21h17',
  blueprint: 'M5 3h9l5 5v13H5zM14 3v5h5M8 13h8M8 17h5',
  offer: 'M4 7h16v12H4zM4 7l2-3h12l2 3M9 11h6',
  message: 'M4 5h16v11H9l-5 4z',
  pipeline: 'M3 6h5v12H3zM9.5 6h5v8h-5zM16 6h5v4h-5',
  project: 'M3 7a2 2 0 0 1 2-2h3.5l2 2.5H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  calculator: 'M6 3h12v18H6zM9 7h6M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15v3',
  spark: 'M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8zM18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
  book: 'M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM17 7h2v13H8',
  academy: 'M3 9l9-4.5L21 9l-9 4.5zM7 11.5V16c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4.5',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5l1.8 1.4-1.8 3.1-2.2-.7a7.3 7.3 0 0 1-1.8 1l-.4 2.3h-3.6l-.4-2.3a7.3 7.3 0 0 1-1.8-1l-2.2.7L3.2 15l1.8-1.4a7 7 0 0 1 0-2L3.2 10 5 6.9l2.2.7a7.3 7.3 0 0 1 1.8-1l.4-2.3h3.6l.4 2.3c.64.25 1.24.58 1.8 1l2.2-.7 1.8 3.1-1.8 1.4a7 7 0 0 1 0 2z',
  map: 'M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20zM9 4v13.5M15 6.5V20',
  'chevron-right': 'M9.5 5.5 16 12l-6.5 6.5',
  'arrow-right': 'M4 12h15M13 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  download: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14',
  upload: 'M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19h14',
  trash: 'M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v6M14 11v6',
  check: 'M5 12.5 10 17.5 19 7',
  alert: 'M12 4 2.5 20h19zM12 10v4.5M12 17.5h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 2v2.5M12 19.5V22M22 12h-2.5M4.5 12H2M19 5l-1.8 1.8M6.8 17.2 5 19M19 19l-1.8-1.8M6.8 6.8 5 5',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16.2 16.2 21 21',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5.2l3.2 2',
}

type IconProps = {
  name: IconName
  size?: number
  className?: string
  /** Quando o ícone carrega significado próprio, informe um rótulo. */
  label?: string
}

export function Icon({ name, size = 20, className, label }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  )
}
