import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import type { IconName } from './Icon'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type SharedProps = {
  variant?: Variant
  size?: Size
  icon?: IconName
  iconEnd?: IconName
  block?: boolean
}

export type ButtonProps = SharedProps & ButtonHTMLAttributes<HTMLButtonElement>

function classes({ variant = 'primary', size = 'md', block }: SharedProps) {
  return ['btn', `btn--${variant}`, `btn--${size}`, block ? 'btn--block' : ''].filter(Boolean).join(' ')
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, icon, iconEnd, block, children, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[classes({ variant, size, block }), className].filter(Boolean).join(' ')}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children && <span className="btn__label">{children}</span>}
      {iconEnd && <Icon name={iconEnd} size={size === 'sm' ? 16 : 18} />}
    </button>
  )
})

type LinkButtonProps = SharedProps & {
  to: string
  children?: React.ReactNode
  className?: string
}

/** Mesma aparência do botão, mas navega — mantém semântica de link. */
export function LinkButton({ to, variant, size, icon, iconEnd, block, children, className }: LinkButtonProps) {
  return (
    <Link to={to} className={[classes({ variant, size, block }), className].filter(Boolean).join(' ')}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children && <span className="btn__label">{children}</span>}
      {iconEnd && <Icon name={iconEnd} size={size === 'sm' ? 16 : 18} />}
    </Link>
  )
}
