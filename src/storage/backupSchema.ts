import type { RepositoryKey } from '@/repositories'
import { DEAL_STAGES } from '@/types/domain'
import type { Entity } from '@/types/domain'

/**
 * Validação estrutural por coleção, usada antes de qualquer gravação.
 *
 * O arquivo de backup é entrada não confiável: pode ter sido editado à mão,
 * truncado no download ou gerado por outra versão. Validar tudo antes de
 * tocar no banco é o que permite a restauração ser "tudo ou nada" — sem isso,
 * um registro quebrado no meio do arquivo deixaria o usuário com metade dos
 * dados substituídos.
 */

export interface RecordIssue {
  collection: RepositoryKey
  index: number
  id?: string
  problem: string
}

type Row = Record<string, unknown>

const isString = (value: unknown): value is string => typeof value === 'string'
const isBool = (value: unknown): value is boolean => typeof value === 'boolean'
const isOptionalString = (value: unknown): boolean => value === undefined || isString(value)
const isOptionalNumber = (value: unknown): boolean =>
  value === undefined || (typeof value === 'number' && Number.isFinite(value))
const isStringArray = (value: unknown): boolean => Array.isArray(value) && value.every(isString)

function requireFields(row: Row, checks: Record<string, (value: unknown) => boolean>): string | null {
  for (const [field, check] of Object.entries(checks)) {
    if (!check(row[field])) return `campo "${field}" ausente ou com tipo inesperado`
  }
  return null
}

/** Validação comum a toda entidade: id e carimbos de tempo. */
function validateEntity(row: Row): string | null {
  if (!isString(row.id) || row.id.trim() === '' || row.id.length > 120) return 'id ausente ou inválido'
  if (!isOptionalString(row.createdAt) || !isOptionalString(row.updatedAt)) return 'carimbo de tempo inválido'
  return null
}

const VALIDATORS: Record<RepositoryKey, (row: Row) => string | null> = {
  companies: (row) =>
    requireFields(row, {
      name: isString,
      segment: isString,
      city: isString,
      digitalPresence: (value) =>
        value === 'site-identificado' ||
        value === 'site-nao-cadastrado' ||
        value === 'site-nao-confirmado' ||
        value === 'presenca-verificada',
      source: (value) => value === 'manual' || value === 'importacao' || value === 'provedor-externo',
      phone: isOptionalString,
      website: isOptionalString,
    }),
  opportunities: (row) => requireFields(row, { serviceKey: isString, title: isString }),
  blueprints: (row) =>
    requireFields(row, {
      name: isString,
      problem: isString,
      audience: isString,
      deliverables: isStringArray,
      tools: isStringArray,
      steps: isStringArray,
      risks: isStringArray,
      estimatedHours: (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0,
      status: (value) => value === 'rascunho' || value === 'pronto',
    }),
  offers: (row) =>
    requireFields(row, {
      name: isString,
      clientOrSegment: isString,
      deliverables: isStringArray,
      clientResponsibilities: isStringArray,
      differentials: isStringArray,
      nextSteps: isStringArray,
      currency: (value) => value === 'BRL',
      status: (value) => value === 'rascunho' || value === 'enviada' || value === 'aceita' || value === 'recusada',
      price: isOptionalNumber,
      deadlineDays: isOptionalNumber,
      revisions: isOptionalNumber,
    }),
  contacts: (row) =>
    requireFields(row, { name: isString, phone: isOptionalString, email: isOptionalString, role: isOptionalString }),
  deals: (row) =>
    requireFields(row, {
      title: isString,
      stage: (value) => typeof value === 'string' && (DEAL_STAGES as readonly string[]).includes(value),
      potentialValue: isOptionalNumber,
    }),
  projects: (row) =>
    requireFields(row, {
      name: isString,
      status: (value) =>
        value === 'briefing' ||
        value === 'planejamento' ||
        value === 'execucao' ||
        value === 'revisao' ||
        value === 'entregue',
      briefing: (value) =>
        Array.isArray(value) &&
        value.every((item) => typeof item === 'object' && item !== null && isString((item as Row).question)),
      deliverables: (value) =>
        Array.isArray(value) &&
        value.every(
          (item) =>
            typeof item === 'object' && item !== null && isString((item as Row).id) && isBool((item as Row).done),
        ),
    }),
  tasks: (row) => requireFields(row, { title: isString, done: isBool, dueDate: isOptionalString }),
  prompts: (row) =>
    requireFields(row, {
      title: isString,
      category: isString,
      role: isString,
      context: isString,
      goal: isString,
      inputs: isStringArray,
      method: isStringArray,
      constraints: isStringArray,
      quality: isStringArray,
      outputFormat: isString,
      review: isString,
      favorite: isBool,
    }),
  activity: (row) => requireFields(row, { kind: isString, message: isString }),
}

/**
 * Valida uma coleção inteira. Devolve a lista de problemas encontrados —
 * vazia significa que a coleção pode ser gravada.
 */
export function validateCollection(collection: RepositoryKey, rows: unknown[]): RecordIssue[] {
  const issues: RecordIssue[] = []
  const seen = new Set<string>()
  const validator = VALIDATORS[collection]

  rows.forEach((row, index) => {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      issues.push({ collection, index, problem: 'registro não é um objeto' })
      return
    }
    const entity = row as Row
    const entityProblem = validateEntity(entity)
    if (entityProblem) {
      issues.push({ collection, index, problem: entityProblem })
      return
    }
    const id = entity.id as string
    if (seen.has(id)) {
      issues.push({ collection, index, id, problem: 'id repetido dentro da mesma coleção' })
      return
    }
    seen.add(id)

    const problem = validator(entity)
    if (problem) issues.push({ collection, index, id, problem })
  })

  return issues
}

export function describeIssues(issues: RecordIssue[], limit = 5): string {
  const shown = issues
    .slice(0, limit)
    .map((issue) => `${issue.collection}[${issue.index}]: ${issue.problem}`)
    .join('; ')
  const rest = issues.length > limit ? ` (e mais ${issues.length - limit})` : ''
  return `${shown}${rest}`
}

export type ValidatedCollections = Partial<Record<RepositoryKey, Entity[]>>
