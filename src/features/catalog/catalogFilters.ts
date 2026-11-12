import type { CatalogService, CatalogCategory, Complexity } from '@/types/catalog'
import type { UserPreferences } from '@/types/domain'

export interface CatalogQuery {
  text?: string
  categories?: CatalogCategory[]
  complexities?: Complexity[]
  segment?: string
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** Busca por nome, resumo, problema, entregável, ferramenta e segmento. */
export function filterCatalog(services: readonly CatalogService[], query: CatalogQuery): CatalogService[] {
  const text = query.text ? normalize(query.text.trim()) : ''
  const categories = query.categories ?? []
  const complexities = query.complexities ?? []
  const segment = query.segment ? normalize(query.segment) : ''

  return services.filter((service) => {
    if (categories.length > 0 && !categories.includes(service.category)) return false
    if (complexities.length > 0 && !complexities.includes(service.complexity)) return false

    if (segment) {
      const matchesSegment = service.segments.some(
        (item) => normalize(item) === 'todos' || normalize(item).includes(segment),
      )
      if (!matchesSegment) return false
    }

    if (!text) return true
    const haystack = normalize(
      [
        service.name,
        service.summary,
        service.problem,
        service.audience,
        ...service.deliverables,
        ...service.tools,
        ...service.skills,
        ...service.segments,
      ].join(' '),
    )
    return text.split(/\s+/).every((term) => haystack.includes(term))
  })
}

export function catalogSegments(services: readonly CatalogService[]): string[] {
  const set = new Set<string>()
  for (const service of services) {
    for (const segment of service.segments) {
      if (segment !== 'Todos') set.add(segment)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

/* ------------------------------------------------------------------ Análise */

export type FitLevel = 'compativel' | 'parcial' | 'desafio'

export interface FitAssessment {
  level: FitLevel
  /** Observações contextuais — nunca uma nota de "potencial de ganho". */
  notes: string[]
  matchedSkills: string[]
}

export const FIT_LABELS: Record<FitLevel, string> = {
  compativel: 'Compatível com o seu perfil',
  parcial: 'Parcialmente compatível',
  desafio: 'Exige preparo antes de vender',
}

/**
 * Avaliação de adequação.
 *
 * Deliberadamente **não** existe pontuação de demanda nem estimativa de
 * faturamento: não há metodologia válida para isso a partir de dados locais, e
 * um número inventado levaria o usuário a decidir com base em ficção. O que o
 * sistema compara é o que ele realmente sabe: as habilidades declaradas pelo
 * usuário, a complexidade do serviço e o esforço estimado.
 */
export function assessFit(service: CatalogService, preferences: UserPreferences): FitAssessment {
  const declared = preferences.skills.map(normalize)
  const matchedSkills = service.skills.filter((skill) => {
    const normalized = normalize(skill)
    return declared.some((item) => normalized.includes(item) || item.includes(normalized))
  })

  const notes: string[] = []
  let level: FitLevel

  if (declared.length === 0) {
    level = 'parcial'
    notes.push('Você ainda não cadastrou suas habilidades, então esta análise considera só a complexidade do serviço.')
  } else if (matchedSkills.length >= 2) {
    level = 'compativel'
    notes.push(`Casa com o que você declarou: ${matchedSkills.join(', ')}.`)
  } else if (matchedSkills.length === 1) {
    level = service.complexity === 'avancado' ? 'desafio' : 'parcial'
    notes.push(`Há uma habilidade em comum (${matchedSkills[0]}), mas o serviço pede outras.`)
  } else {
    level = service.complexity === 'iniciante' ? 'parcial' : 'desafio'
    notes.push('Nenhuma das habilidades que você cadastrou aparece neste serviço.')
  }

  if (service.complexity === 'iniciante') {
    notes.push('Escopo curto e previsível: serve bem como primeiro serviço ou porta de entrada em um cliente.')
  }
  if (service.complexity === 'avancado') {
    notes.push('Envolve dependência de ferramentas de terceiros e manutenção — combine suporte desde a proposta.')
  }

  const [min, max] = service.hours
  notes.push(`Esforço estimado de ${min} a ${max} horas, conforme o tamanho do cliente e a qualidade do material recebido.`)

  if (preferences.hourlyRate === undefined) {
    notes.push('Cadastre seu valor por hora nas configurações para transformar esse esforço em preço na calculadora.')
  }

  return { level, notes, matchedSkills }
}
