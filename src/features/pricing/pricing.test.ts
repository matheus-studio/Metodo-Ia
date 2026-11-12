import { describe, expect, it } from 'vitest'
import { computeQuote, DEFAULT_QUOTE } from './pricing'

const base = {
  ...DEFAULT_QUOTE,
  hourlyRate: 100,
  hours: 10,
  revisions: 2,
  hoursPerRevision: 1,
  overheadHours: 2,
  toolCosts: 0,
  expenses: 0,
  marginPercent: 0,
  taxPercent: 0,
}

describe('computeQuote', () => {
  it('soma execução, revisões e horas de reunião nas horas faturáveis', () => {
    const quote = computeQuote(base)
    expect(quote.billableHours).toBe(14)
    expect(quote.laborCost).toBe(1400)
    expect(quote.total).toBe(1400)
  })

  it('aplica margem sobre custo de trabalho mais despesas', () => {
    const quote = computeQuote({ ...base, expenses: 100, marginPercent: 20 })
    // (1400 + 100) × 1,20
    expect(quote.subtotal).toBe(1500)
    expect(quote.margin).toBe(300)
    expect(quote.total).toBe(1800)
  })

  it('embute o imposto no valor final em vez de somar por fora', () => {
    const quote = computeQuote({ ...base, taxPercent: 10 })
    // 1400 / 0,9 = 1555,56 — cobrar 1540 deixaria o líquido abaixo do custo.
    expect(quote.total).toBeCloseTo(1555.56, 2)
    expect(quote.beforeTax).toBe(1400)
    expect(quote.tax).toBeCloseTo(155.56, 2)
  })

  it('calcula o ganho por hora realmente trabalhada', () => {
    const quote = computeQuote({ ...base, marginPercent: 40 })
    expect(quote.effectiveHourlyRate).toBe(140)
  })

  it('ignora entrada negativa ou inválida em vez de gerar número absurdo', () => {
    const quote = computeQuote({ ...base, hours: -5, expenses: Number.NaN })
    expect(quote.billableHours).toBe(4)
    expect(Number.isFinite(quote.total)).toBe(true)
  })

  it('avisa sobre valor por hora ausente, margem zero e revisões indefinidas', () => {
    const quote = computeQuote({ ...base, hourlyRate: 0, marginPercent: 0, revisions: 0, overheadHours: 0 })
    const warnings = quote.warnings.join(' ')
    expect(warnings).toContain('valor por hora')
    expect(warnings).toContain('margem')
    expect(warnings).toContain('revisão')
    expect(warnings).toContain('reunião')
  })

  it('explica cada linha da conta', () => {
    const quote = computeQuote({ ...base, marginPercent: 20 })
    expect(quote.lines.map((line) => line.label)).toContain('Execução')
    expect(quote.lines.every((line) => line.detail.length > 5)).toBe(true)
  })

  it('não inventa preço de mercado quando nada foi informado', () => {
    const quote = computeQuote({ ...DEFAULT_QUOTE, hourlyRate: 0, hours: 0, overheadHours: 0, revisions: 0 })
    expect(quote.total).toBe(0)
    expect(quote.effectiveHourlyRate).toBe(0)
  })
})
