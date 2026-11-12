import type { ActivityEntry, ActivityKind } from '@/types/domain'

/**
 * Missões da semana.
 *
 * Nada de pontos, medalhas ou nível. O progresso vem do registro real de
 * atividade — a mesma fonte que alimenta o histórico do painel. Missão aqui é
 * um lembrete de ritmo: o que costuma faltar em quem está começando não é
 * motivação, é constância em quatro ou cinco ações simples.
 */

export interface Mission {
  key: string
  label: string
  description: string
  kind: ActivityKind
  target: number
  progress: number
  done: boolean
  moduleKey: string
}

export interface WeekRange {
  start: Date
  end: Date
  label: string
}

/** Semana de segunda a domingo, no fuso local. */
export function weekRange(reference: Date = new Date()): WeekRange {
  const start = new Date(reference)
  const weekday = (start.getDay() + 6) % 7 // segunda = 0
  start.setDate(start.getDate() - weekday)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  const format = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
  const lastDay = new Date(end.getTime() - 1)
  return { start, end, label: `${format.format(start)} a ${format.format(lastDay)}` }
}

export function countByKind(activities: ActivityEntry[], range: WeekRange): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const entry of activities) {
    const at = new Date(entry.createdAt)
    if (at >= range.start && at < range.end) {
      counts[entry.kind] = (counts[entry.kind] ?? 0) + 1
    }
  }
  return counts
}

interface MissionDefinition {
  key: string
  label: string
  description: string
  kind: ActivityKind
  target: number
  moduleKey: string
}

const DEFINITIONS: readonly MissionDefinition[] = [
  {
    key: 'oportunidades',
    label: 'Escolher oportunidades',
    description: 'Salve serviços do catálogo que combinam com o que você sabe fazer.',
    kind: 'oportunidade-salva',
    target: 3,
    moduleKey: 'radar-servicos',
  },
  {
    key: 'servico',
    label: 'Estruturar um serviço',
    description: 'Escopo, entregáveis e etapas definidos — é o que sustenta a proposta.',
    kind: 'servico-criado',
    target: 1,
    moduleKey: 'service-builder',
  },
  {
    key: 'oferta',
    label: 'Criar uma oferta',
    description: 'Transforme o serviço em proposta com preço, prazo e revisões.',
    kind: 'oferta-criada',
    target: 1,
    moduleKey: 'offers',
  },
  {
    key: 'empresas',
    label: 'Registrar empresas',
    description: 'Cadastre negócios que você conhece ou visitou, com o que verificou de cada um.',
    kind: 'empresa-registrada',
    target: 3,
    moduleKey: 'crm',
  },
  {
    key: 'abordagens',
    label: 'Fazer abordagens',
    description: 'Prepare, revise e envie você mesmo. Uma por vez, personalizada.',
    kind: 'negociacao-atualizada',
    target: 5,
    moduleKey: 'prospecting',
  },
  {
    key: 'tarefas',
    label: 'Concluir tarefas de projeto',
    description: 'Entrega em dia é o que faz o cliente voltar e indicar.',
    kind: 'tarefa-concluida',
    target: 3,
    moduleKey: 'projects',
  },
]

export function weeklyMissions(activities: ActivityEntry[], reference: Date = new Date()): Mission[] {
  const range = weekRange(reference)
  const counts = countByKind(activities, range)

  return DEFINITIONS.map((definition) => {
    const progress = counts[definition.kind] ?? 0
    return {
      ...definition,
      progress,
      done: progress >= definition.target,
    }
  })
}

export interface WeekSummary {
  completed: number
  total: number
  percent: number
  /** Missão com menor progresso relativo — por onde começar hoje. */
  focus: Mission | null
}

export function summarizeWeek(missions: Mission[]): WeekSummary {
  const completed = missions.filter((mission) => mission.done).length
  const pending = missions.filter((mission) => !mission.done)
  const focus =
    pending.length === 0
      ? null
      : [...pending].sort((a, b) => a.progress / a.target - b.progress / b.target)[0] ?? null

  return {
    completed,
    total: missions.length,
    percent: missions.length === 0 ? 0 : Math.round((completed / missions.length) * 100),
    focus,
  }
}
