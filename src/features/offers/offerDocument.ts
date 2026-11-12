import type { Offer } from '@/types/domain'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function section(title: string, body?: string | null): string[] {
  if (!body || body.trim() === '') return []
  return [`## ${title}`, '', body.trim(), '']
}

function listSection(title: string, items: string[]): string[] {
  if (items.length === 0) return []
  return [`## ${title}`, '', ...items.map((item) => `- ${item}`), '']
}

/**
 * Converte a oferta em um documento de texto.
 *
 * Função pura: é o que alimenta copiar, exportar e a pré-visualização, então
 * uma mudança de formato acontece em um lugar só — e é testável sem interface.
 * Seções vazias não aparecem: proposta com título órfão passa impressão de
 * trabalho inacabado.
 */
export function offerToMarkdown(offer: Offer): string {
  const lines: string[] = [`# ${offer.name}`, '']

  if (offer.clientOrSegment.trim()) {
    lines.push(`**Para:** ${offer.clientOrSegment.trim()}`, '')
  }

  lines.push(
    ...section('O problema', offer.problem),
    ...section('A solução proposta', offer.solution),
    ...section('Por que isso vale a pena', offer.valueProposition),
    ...section('Escopo', offer.scope),
    ...listSection('Entregáveis', offer.deliverables),
  )

  const terms: string[] = []
  if (offer.price !== undefined) terms.push(`- **Investimento:** ${formatCurrency(offer.price)}`)
  if (offer.deadlineDays !== undefined) terms.push(`- **Prazo:** ${offer.deadlineDays} dias úteis após o briefing`)
  if (offer.revisions !== undefined) terms.push(`- **Revisões incluídas:** ${offer.revisions}`)
  if (terms.length > 0) {
    lines.push('## Condições comerciais', '', ...terms, '')
  }

  lines.push(
    ...listSection('Responsabilidades do cliente', offer.clientResponsibilities),
    ...section('Condições e observações', offer.conditions),
    ...listSection('Diferenciais', offer.differentials),
    ...listSection('Próximos passos', offer.nextSteps),
    ...section('Para seguir', offer.callToAction),
  )

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

/** Campos cuja ausência fragiliza a proposta na hora da negociação. */
export function offerGaps(offer: Offer): string[] {
  const gaps: string[] = []
  if (!offer.problem?.trim()) gaps.push('O problema do cliente não está escrito.')
  if (!offer.solution?.trim()) gaps.push('A solução proposta não está descrita.')
  if (offer.deliverables.length === 0) gaps.push('Sem entregáveis, o escopo fica aberto a interpretação.')
  if (offer.price === undefined) gaps.push('Sem preço definido.')
  if (offer.deadlineDays === undefined) gaps.push('Sem prazo definido.')
  if (offer.revisions === undefined) gaps.push('Sem número de revisões: é a origem mais comum de retrabalho não pago.')
  if (offer.clientResponsibilities.length === 0)
    gaps.push('Sem responsabilidades do cliente, atrasos dele viram atraso seu.')
  if (offer.nextSteps.length === 0) gaps.push('Sem próximos passos, a proposta termina sem direção.')
  return gaps
}
