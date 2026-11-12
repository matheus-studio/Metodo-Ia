import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '@/components/ui'

/** Campos de formulário compartilhados. Rótulo sempre associado ao controle. */

type BaseProps = {
  label: string
  hint?: string
  required?: boolean
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength = 200,
  required,
  min,
  step,
}: BaseProps & {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'number' | 'date' | 'tel' | 'email' | 'url'
  maxLength?: number
  min?: number
  step?: number
}) {
  const id = useId()
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span className="field__required"> *</span>}
      </label>
      <input
        id={id}
        className={`field__input${type === 'number' ? ' tabular' : ''}`}
        type={type}
        value={value}
        maxLength={maxLength}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}

export function TextAreaField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength = 4000,
  required,
}: BaseProps & {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
}) {
  const id = useId()
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span className="field__required"> *</span>}
      </label>
      <textarea
        id={id}
        className="field__input field__input--area"
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}

export function SelectField<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
}: BaseProps & {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  const id = useId()
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="field__input" value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}

/** Editor de lista: usado em entregáveis, etapas, ferramentas e riscos. */
export function ListField({
  label,
  hint,
  items,
  onChange,
  placeholder,
  addLabel = 'Adicionar',
}: BaseProps & {
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  addLabel?: string
}) {
  const id = useId()
  const [draft, setDraft] = useState('')

  function add() {
    const value = draft.trim()
    if (!value) return
    onChange([...items, value.slice(0, 180)])
    setDraft('')
  }

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="list-field__input-row">
        <input
          id={id}
          className="field__input"
          value={draft}
          placeholder={placeholder}
          maxLength={180}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
        />
        <button type="button" className="btn btn--secondary btn--md" onClick={add}>
          <Icon name="plus" size={16} />
          <span className="btn__label">{addLabel}</span>
        </button>
      </div>
      {items.length > 0 && (
        <ul className="list-field__items">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="list-field__item">
              <span>{item}</span>
              <button
                type="button"
                className="icon-button icon-button--sm"
                aria-label={`Remover "${item}"`}
                onClick={() => onChange(items.filter((_, position) => position !== index))}
              >
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}

export function FormGrid({ children, columns = 2 }: { children: ReactNode; columns?: 1 | 2 }) {
  return <div className={`form-grid form-grid--${columns}`}>{children}</div>
}
