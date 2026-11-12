import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import type { IconName } from './Icon'

export { Icon } from './Icon'
export type { IconName } from './Icon'
export { Button, LinkButton } from './Button'

/* ------------------------------------------------------------------ Panel */

type PanelProps = {
  children: ReactNode
  tone?: 'default' | 'flat' | 'accent'
  className?: string
  /** Índice usado na animação de entrada escalonada. */
  index?: number
  as?: 'div' | 'section' | 'article' | 'aside'
}

export function Panel({ children, tone = 'default', className, index, as: Tag = 'section' }: PanelProps) {
  const toneClass = tone === 'default' ? '' : `panel--${tone}`
  return (
    <Tag
      className={['panel', toneClass, index !== undefined ? 'animate-rise' : '', className].filter(Boolean).join(' ')}
      style={index !== undefined ? ({ '--stagger-index': index } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  )
}

/* ------------------------------------------------------------------ Badge */

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'data' | 'success' | 'danger'
  dot?: boolean
}) {
  return (
    <span className={`badge${tone === 'neutral' ? '' : ` badge--${tone}`}`}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  )
}

/* ---------------------------------------------------------- SectionHeader */

export function SectionHeader({
  title,
  description,
  action,
  id,
}: {
  title: string
  description?: string
  action?: ReactNode
  id?: string
}) {
  return (
    <header className="section-header">
      <div>
        <h2 className="section-header__title" id={id}>
          {title}
        </h2>
        {description && <p className="section-header__description">{description}</p>}
      </div>
      {action}
    </header>
  )
}

/* ------------------------------------------------------------------- Stat */

export function Stat({
  label,
  value,
  hint,
  icon,
  to,
}: {
  label: string
  value: number | string
  hint?: string
  icon?: IconName
  to?: string
}) {
  const content = (
    <>
      <span className="stat__label">
        {icon && <Icon name={icon} size={14} />}
        {label}
      </span>
      <span className="stat__value tabular">{value}</span>
      {hint && <span className="stat__hint">{hint}</span>}
    </>
  )
  return to ? (
    <Link className="stat" to={to}>
      {content}
    </Link>
  ) : (
    <div className="stat">{content}</div>
  )
}

/* ------------------------------------------------------------ EmptyState */

export function EmptyState({
  icon = 'spark',
  title,
  text,
  action,
}: {
  icon?: IconName
  title: string
  text?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={24} />
      </span>
      <p className="empty-state__title">{title}</p>
      {text && <p className="empty-state__text">{text}</p>}
      {action}
    </div>
  )
}

/* ----------------------------------------------------------------- Meter */

export function Meter({
  value,
  max = 100,
  leftLabel,
  rightLabel,
  label,
}: {
  value: number
  max?: number
  leftLabel?: string
  rightLabel?: string
  label: string
}) {
  const safeMax = max <= 0 ? 1 : max
  const ratio = Math.min(1, Math.max(0, value / safeMax))
  return (
    <div className="meter">
      <div
        className="meter__track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="meter__fill" style={{ '--meter-scale': ratio } as React.CSSProperties} />
      </div>
      {(leftLabel || rightLabel) && (
        <div className="meter__labels">
          <span>{leftLabel}</span>
          <span className="tabular">{rightLabel}</span>
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- Notice */

export function Notice({
  children,
  tone = 'info',
  icon,
}: {
  children: ReactNode
  tone?: 'info' | 'warning' | 'danger'
  icon?: IconName
}) {
  const fallback: IconName = tone === 'info' ? 'info' : 'alert'
  return (
    <div className={`notice${tone === 'info' ? '' : ` notice--${tone}`}`}>
      <span className="notice__icon">
        <Icon name={icon ?? fallback} size={18} />
      </span>
      <div>{children}</div>
    </div>
  )
}
