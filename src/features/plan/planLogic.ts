/**
 * Plano de 7 dias até o primeiro cliente.
 *
 * Tudo aqui é lógica pura e local: a "ação de hoje" sai dos números reais que o
 * usuário registrou (negócios na fila, respostas, retornos devidos), nunca de
 * estimativa. As metas medem **esforço** (quantas abordagens você fez), não
 * resultado — o aplicativo não promete que alguém vá comprar.
 */

export interface DayLog {
  abordagens: number
  followups: number
  salvos: number
}

export interface Plan {
  serviceKey: string
  city: string
  senderName?: string
  /** Abordagens por dia. */
  dailyGoal: number
  /** Dia local (AAAA-MM-DD) em que o plano começou. */
  startedOn: string
  /** Quando o usuário confirmou que a mensagem está pronta. */
  readyAt?: string
  log: Record<string, DayLog>
}

export const PLAN_KEY = 'metodo-ia-pro:plan'
export const PLAN_DAYS = 7
export const FIND_BATCH_MIN = 10
export const FOLLOWUP_GOAL = 3
export const GOAL_OPTIONS = [3, 5, 10] as const
export const DEFAULT_DAILY_GOAL = 5

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 86_400_000

/* ------------------------------------------------------------------ datas */

export function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Meio-dia local evita que mudança de horário de verão desloque o dia. */
function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12, 0, 0)
}

export function addDays(key: string, amount: number): string {
  const date = parseKey(key)
  date.setDate(date.getDate() + amount)
  return dateKey(date)
}

/** Dia do plano, a partir de 1. Passa de 7 quando o plano já terminou. */
export function dayNumber(plan: Plan, now: Date): number {
  const diff = Math.round((parseKey(dateKey(now)).getTime() - parseKey(plan.startedOn).getTime()) / DAY_MS)
  return Math.max(1, diff + 1)
}

/* ------------------------------------------------------------ validação */

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(10_000, Math.max(0, Math.round(value))) : 0
}

/** O conteúdo guardado e o que vem de um backup são entrada não confiável. */
export function sanitizePlan(input: unknown): Plan | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null
  const raw = input as Record<string, unknown>
  if (typeof raw.serviceKey !== 'string' || raw.serviceKey.length === 0 || raw.serviceKey.length > 80) return null
  if (typeof raw.startedOn !== 'string' || !DAY_KEY.test(raw.startedOn)) return null

  const goal = typeof raw.dailyGoal === 'number' && Number.isFinite(raw.dailyGoal) ? Math.round(raw.dailyGoal) : DEFAULT_DAILY_GOAL
  const log: Record<string, DayLog> = {}
  if (typeof raw.log === 'object' && raw.log !== null && !Array.isArray(raw.log)) {
    for (const [key, value] of Object.entries(raw.log as Record<string, unknown>).slice(0, 400)) {
      if (!DAY_KEY.test(key) || typeof value !== 'object' || value === null) continue
      const entry = value as Record<string, unknown>
      log[key] = { abordagens: count(entry.abordagens), followups: count(entry.followups), salvos: count(entry.salvos) }
    }
  }

  return {
    serviceKey: raw.serviceKey,
    city: typeof raw.city === 'string' ? raw.city.slice(0, 80) : '',
    senderName: typeof raw.senderName === 'string' && raw.senderName.trim() ? raw.senderName.trim().slice(0, 80) : undefined,
    dailyGoal: Math.min(30, Math.max(1, goal)),
    startedOn: raw.startedOn,
    readyAt: typeof raw.readyAt === 'string' ? raw.readyAt.slice(0, 40) : undefined,
    log,
  }
}

/* ------------------------------------------------------------ contagem */

const EMPTY_LOG: DayLog = { abordagens: 0, followups: 0, salvos: 0 }

export function logOf(plan: Plan, key: string): DayLog {
  return plan.log[key] ?? EMPTY_LOG
}

export function bump(plan: Plan, field: keyof DayLog, now: Date, by = 1): Plan {
  const key = dateKey(now)
  const current = logOf(plan, key)
  return { ...plan, log: { ...plan.log, [key]: { ...current, [field]: current[field] + by } } }
}

export function totalOf(plan: Plan, field: keyof DayLog): number {
  return Object.values(plan.log).reduce((total, entry) => total + entry[field], 0)
}

/* ------------------------------------------------------------ próxima ação */

export interface PlanCounts {
  /** Negócios salvos e ainda não abordados. */
  novos: number
  /** Abordados, aguardando resposta. */
  aguardando: number
  /** Responderam e esperam você. */
  responderam: number
  /** Abordados há tempo suficiente para um retorno. */
  retornosDevidos: number
}

export type ActionKind = 'ready' | 'reply' | 'contact' | 'find' | 'followup' | 'done'

export interface PlanAction {
  kind: ActionKind
  title: string
  detail: string
  cta: string
  to: string
  progress?: { value: number; max: number }
}

export function nextAction(plan: Plan, counts: PlanCounts, now: Date): PlanAction {
  const today = logOf(plan, dateKey(now))
  const remaining = Math.max(0, plan.dailyGoal - today.abordagens)

  if (!plan.readyAt) {
    return {
      kind: 'ready',
      title: 'Deixe sua mensagem pronta',
      detail: 'Leia o que você vai oferecer e confirme seu nome. Leva uns 3 minutos e evita mandar mensagem sem saber o que está vendendo.',
      cta: 'Preparar agora',
      to: '#preparar',
    }
  }

  if (counts.responderam > 0) {
    const n = counts.responderam
    return {
      kind: 'reply',
      title: n === 1 ? '1 pessoa respondeu' : `${n} pessoas responderam`,
      detail: 'Quem respondeu é quem está mais perto de comprar. Responda hoje, antes de abordar gente nova.',
      cta: 'Ver quem respondeu',
      to: '/clientes?aba=lista&etapa=respondeu',
    }
  }

  if (remaining > 0 && counts.novos > 0) {
    return {
      kind: 'contact',
      title: `Aborde ${remaining} ${remaining === 1 ? 'negócio' : 'negócios'} hoje`,
      detail: 'Escolha um da fila, copie a mensagem pronta e envie você mesmo. Um por vez.',
      cta: 'Abordar agora',
      to: '/clientes?aba=lista&etapa=novo',
      progress: { value: today.abordagens, max: plan.dailyGoal },
    }
  }

  if (remaining > 0) {
    return {
      kind: 'find',
      title: counts.novos === 0 && totalOf(plan, 'salvos') === 0 ? 'Ache seus primeiros negócios' : 'Sua fila acabou: ache mais negócios',
      detail:
        totalOf(plan, 'salvos') === 0
          ? `Salve uns ${FIND_BATCH_MIN} negócios da sua cidade para ter folga. O app abre as buscas por você.`
          : `Faltam ${remaining} abordagens hoje e não há ninguém na fila.`,
      cta: 'Achar clientes',
      to: '/clientes?aba=achar',
      progress: { value: today.abordagens, max: plan.dailyGoal },
    }
  }

  if (counts.retornosDevidos > 0) {
    const n = counts.retornosDevidos
    return {
      kind: 'followup',
      title: n === 1 ? '1 retorno para dar' : `${n} retornos para dar`,
      detail: 'Muita gente só responde na segunda mensagem. Um lembrete educado, uma vez, sem insistir.',
      cta: 'Fazer retornos',
      to: '/clientes?aba=lista&etapa=contatado',
    }
  }

  return {
    kind: 'done',
    title: 'Meta de hoje cumprida',
    detail: 'Boa. Resultado vem de repetir isso nos próximos dias. Se quiser adiantar, salve mais negócios para amanhã.',
    cta: 'Salvar mais negócios',
    to: '/clientes?aba=achar',
  }
}

/* ------------------------------------------------------------ faixa da semana */

export type DayState = 'feito' | 'hoje' | 'perdido' | 'pendente' | 'futuro'

export interface WeekDay {
  day: number
  date: string
  title: string
  state: DayState
}

const DAY_TITLES = ['Início', 'Texto', 'Achar', 'Abordar', 'Abordar', 'Abordar', 'Retorno'] as const

export function week(plan: Plan, now: Date): WeekDay[] {
  const todayKey = dateKey(now)
  const saved = totalOf(plan, 'salvos')

  return DAY_TITLES.map((title, index) => {
    const day = index + 1
    const date = addDays(plan.startedOn, index)
    const log = logOf(plan, date)

    let done: boolean
    let repeatable: boolean // pode ser feito depois do dia?
    if (day === 1) {
      done = true
      repeatable = false
    } else if (day === 2) {
      done = Boolean(plan.readyAt)
      repeatable = true
    } else if (day === 3) {
      done = saved >= FIND_BATCH_MIN
      repeatable = true
    } else if (day <= 6) {
      done = log.abordagens >= plan.dailyGoal
      repeatable = false
    } else {
      done = log.followups >= 1 || log.abordagens >= plan.dailyGoal
      repeatable = false
    }

    let state: DayState
    if (done) state = 'feito'
    else if (date === todayKey) state = 'hoje'
    else if (date > todayKey) state = 'futuro'
    else state = repeatable ? 'pendente' : 'perdido'

    return { day, date, title, state }
  })
}

export function planFinished(plan: Plan, now: Date): boolean {
  return dayNumber(plan, now) > PLAN_DAYS
}
