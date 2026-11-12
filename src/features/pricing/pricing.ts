/**
 * Calculadora de preços.
 *
 * O que ela faz: soma o que você informou e mostra cada passo da conta.
 * O que ela não faz: dizer quanto o mercado paga. Isso varia por região,
 * segmento e experiência, e um número inventado aqui viraria âncora para uma
 * decisão comercial real. A calculadora responde "quanto preciso cobrar para
 * este trabalho não sair no prejuízo", que é uma pergunta com resposta.
 */

export interface QuoteInput {
  /** Seu valor por hora. */
  hourlyRate: number
  /** Horas de execução estimadas. */
  hours: number
  /** Revisões incluídas na proposta. */
  revisions: number
  /** Horas que você gasta, em média, por revisão. */
  hoursPerRevision: number
  /** Horas não cobradas diretamente: reunião, briefing, idas e vindas. */
  overheadHours: number
  /** Custos de ferramenta/assinatura que entram neste projeto. */
  toolCosts: number
  /** Outras despesas repassadas (gráfica, banco de imagens, domínio). */
  expenses: number
  /** Margem sobre o custo, em porcentagem. */
  marginPercent: number
  /** Impostos e taxas sobre o valor final, em porcentagem. */
  taxPercent: number
}

export const DEFAULT_QUOTE: QuoteInput = {
  hourlyRate: 0,
  hours: 8,
  revisions: 2,
  hoursPerRevision: 1,
  overheadHours: 2,
  toolCosts: 0,
  expenses: 0,
  marginPercent: 20,
  taxPercent: 0,
}

export interface QuoteLine {
  label: string
  /** Como o número saiu — o usuário precisa poder refazer a conta no papel. */
  detail: string
  value: number
}

export interface Quote {
  billableHours: number
  lines: QuoteLine[]
  laborCost: number
  directCosts: number
  subtotal: number
  margin: number
  beforeTax: number
  tax: number
  total: number
  /** Quanto o projeto rende por hora realmente trabalhada. */
  effectiveHourlyRate: number
  warnings: string[]
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function sanitize(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function computeQuote(input: QuoteInput): Quote {
  const hourlyRate = sanitize(input.hourlyRate)
  const hours = sanitize(input.hours)
  const revisions = sanitize(input.revisions)
  const hoursPerRevision = sanitize(input.hoursPerRevision)
  const overheadHours = sanitize(input.overheadHours)
  const toolCosts = sanitize(input.toolCosts)
  const expenses = sanitize(input.expenses)
  const marginPercent = sanitize(input.marginPercent)
  const taxPercent = Math.min(sanitize(input.taxPercent), 99)

  const revisionHours = revisions * hoursPerRevision
  const billableHours = hours + revisionHours + overheadHours
  const laborCost = round(billableHours * hourlyRate)
  const directCosts = round(toolCosts + expenses)
  const subtotal = round(laborCost + directCosts)
  const margin = round(subtotal * (marginPercent / 100))
  const beforeTax = round(subtotal + margin)
  // Imposto incide sobre o valor cobrado: é preciso embutir, não somar por fora.
  const total = taxPercent > 0 ? round(beforeTax / (1 - taxPercent / 100)) : beforeTax
  const tax = round(total - beforeTax)

  const lines: QuoteLine[] = [
    {
      label: 'Execução',
      detail: `${hours} h × ${hourlyRate.toLocaleString('pt-BR')} por hora`,
      value: round(hours * hourlyRate),
    },
    {
      label: 'Revisões',
      detail: `${revisions} revisão(ões) × ${hoursPerRevision} h × ${hourlyRate.toLocaleString('pt-BR')}`,
      value: round(revisionHours * hourlyRate),
    },
    {
      label: 'Reuniões e briefing',
      detail: `${overheadHours} h que você trabalha mas raramente cobra`,
      value: round(overheadHours * hourlyRate),
    },
    { label: 'Ferramentas', detail: 'Assinaturas e licenças usadas neste projeto', value: round(toolCosts) },
    { label: 'Despesas repassadas', detail: 'Gráfica, domínio, banco de imagens, deslocamento', value: round(expenses) },
    { label: `Margem (${marginPercent}%)`, detail: 'Sobre custo de trabalho e despesas', value: margin },
  ]

  if (taxPercent > 0) {
    lines.push({
      label: `Impostos e taxas (${taxPercent}%)`,
      detail: 'Embutidos no valor final, não somados por fora',
      value: tax,
    })
  }

  const warnings: string[] = []
  if (hourlyRate === 0) {
    warnings.push('Defina seu valor por hora — sem ele a conta não tem base.')
  }
  if (overheadHours === 0) {
    warnings.push('Zero hora de reunião e briefing é raro. Essas horas existem; a questão é se você as cobra.')
  }
  if (marginPercent === 0) {
    warnings.push('Sem margem, o preço cobre o custo e nada mais — qualquer imprevisto vira prejuízo.')
  }
  if (revisions === 0) {
    warnings.push('Proposta sem revisão definida costuma virar revisão ilimitada na prática.')
  }

  return {
    billableHours,
    lines,
    laborCost,
    directCosts,
    subtotal,
    margin,
    beforeTax,
    tax,
    total,
    effectiveHourlyRate: billableHours > 0 ? round(total / billableHours) : 0,
    warnings,
  }
}
