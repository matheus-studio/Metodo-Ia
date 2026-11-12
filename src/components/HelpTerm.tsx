import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/ui'
import { termByKey } from '@/features/academy/academyData'

/**
 * Ajuda contextual: explica um termo técnico no ponto em que ele aparece.
 *
 * Fica fechado por padrão e ocupa um ícone. Quem já sabe o que é um funil não
 * precisa ler nada; quem não sabe não precisa sair da tela para descobrir —
 * que é o ponto de um produto para quem está começando.
 */
export function HelpTerm({ termKey, label }: { termKey: string; label?: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const term = termByKey(termKey)
  if (!term) return null

  return (
    <span className="help-term">
      <button
        type="button"
        className="help-term__trigger"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`O que é ${term.term}?`}
        onClick={() => setOpen((value) => !value)}
      >
        {label ?? term.term}
        <Icon name="info" size={13} />
      </button>
      {open && (
        <span className="help-term__panel" id={id} role="note">
          <strong>{term.term}.</strong> {term.definition}
          <span className="help-term__example">Exemplo: {term.example}</span>
          <Link to={`/academia?aula=${termAnchor(termKey)}`} className="help-term__link">
            Ver na Academia
          </Link>
        </span>
      )}
    </span>
  )
}

/** Alguns termos têm aula própria; os demais caem no glossário. */
function termAnchor(termKey: string): string {
  const lessons: Record<string, string> = {
    crm: 'o-que-e-crm',
    funil: 'funil',
    briefing: 'briefing',
    escopo: 'escopo-e-entregaveis',
    entregavel: 'escopo-e-entregaveis',
    margem: 'precificacao',
    'valor-hora': 'precificacao',
    prompt: 'engenharia-de-prompt',
    'variavel-de-prompt': 'engenharia-de-prompt',
    'engenharia-de-prompt': 'engenharia-de-prompt',
    automacao: 'automacao',
    'proposta-comercial': 'proposta-comercial',
    oferta: 'oferta',
    cta: 'copy-basico',
    copywriting: 'copy-basico',
    prospeccao: 'prospeccao-basico',
    'follow-up': 'prospeccao-basico',
    lead: 'o-que-e-crm',
    revisao: 'prazos-e-revisoes',
  }
  return lessons[termKey] ?? ''
}
