import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES } from '@/types/domain'
import { CATALOG, serviceByKey } from './catalogData'
import { assessFit, catalogSegments, filterCatalog } from './catalogFilters'

describe('catálogo', () => {
  it('tem chaves únicas e campos obrigatórios preenchidos', () => {
    const keys = new Set(CATALOG.map((service) => service.key))
    expect(keys.size).toBe(CATALOG.length)

    for (const service of CATALOG) {
      expect(service.name.length).toBeGreaterThan(3)
      expect(service.problem.length).toBeGreaterThan(20)
      expect(service.deliverables.length).toBeGreaterThan(1)
      expect(service.plan.length).toBeGreaterThan(2)
      expect(service.pricing.length).toBeGreaterThan(0)
      expect(service.risks.length).toBeGreaterThan(0)
      expect(service.hours[0]).toBeLessThanOrEqual(service.hours[1])
    }
  })

  it('não traz preço em nenhum serviço — só modelos de cobrança', () => {
    for (const service of CATALOG) {
      const text = JSON.stringify(service.pricing)
      expect(text).not.toMatch(/R\$\s?\d/)
    }
  })
})

describe('filterCatalog', () => {
  it('sem filtro devolve tudo', () => {
    expect(filterCatalog(CATALOG, {})).toHaveLength(CATALOG.length)
  })

  it('busca ignorando acento e caixa', () => {
    const results = filterCatalog(CATALOG, { text: 'CARDAPIO' })
    expect(results.some((service) => service.key === 'cardapio-digital')).toBe(true)
  })

  it('busca pelo problema, não só pelo nome', () => {
    const results = filterCatalog(CATALOG, { text: 'caderno' })
    expect(results.some((service) => service.key === 'organizacao-planilhas')).toBe(true)
  })

  it('exige todos os termos da busca', () => {
    expect(filterCatalog(CATALOG, { text: 'cardapio jurídico' })).toHaveLength(0)
  })

  it('filtra por categoria e complexidade juntas', () => {
    const results = filterCatalog(CATALOG, { categories: ['sites'], complexities: ['iniciante'] })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((service) => service.category === 'sites' && service.complexity === 'iniciante')).toBe(true)
  })

  it('inclui serviços marcados como "Todos" ao filtrar por segmento', () => {
    const results = filterCatalog(CATALOG, { segment: 'Alimentação' })
    expect(results.some((service) => service.segments.includes('Todos'))).toBe(true)
    expect(results.some((service) => service.key === 'cardapio-digital')).toBe(true)
  })

  it('lista segmentos sem repetir e sem o curinga "Todos"', () => {
    const segments = catalogSegments(CATALOG)
    expect(new Set(segments).size).toBe(segments.length)
    expect(segments).not.toContain('Todos')
  })
})

describe('assessFit', () => {
  const service = serviceByKey('site-institucional')!

  it('sem habilidades cadastradas, não afirma compatibilidade', () => {
    const fit = assessFit(service, DEFAULT_PREFERENCES)
    expect(fit.level).toBe('parcial')
    expect(fit.notes.join(' ')).toContain('habilidades')
  })

  it('reconhece duas ou mais habilidades em comum', () => {
    const fit = assessFit(service, {
      ...DEFAULT_PREFERENCES,
      skills: ['Organização de conteúdo', 'Escrita clara'],
    })
    expect(fit.level).toBe('compativel')
    expect(fit.matchedSkills.length).toBeGreaterThanOrEqual(2)
  })

  it('trata serviço avançado sem afinidade como desafio', () => {
    const avancado = serviceByKey('automacao-rotinas')!
    const fit = assessFit(avancado, { ...DEFAULT_PREFERENCES, skills: ['fotografia'] })
    expect(fit.level).toBe('desafio')
  })

  it('nunca produz pontuação de demanda ou faturamento', () => {
    const fit = assessFit(service, { ...DEFAULT_PREFERENCES, skills: ['escrita clara'] })
    const text = fit.notes.join(' ')
    expect(text).not.toMatch(/R\$/)
    expect(text).not.toMatch(/\b\d+%/)
    expect(fit).not.toHaveProperty('score')
  })

  it('sempre informa o esforço estimado', () => {
    const fit = assessFit(service, DEFAULT_PREFERENCES)
    expect(fit.notes.join(' ')).toContain('horas')
  })
})
