import { describe, expect, it } from 'vitest'
import { addDays, bump, dateKey, dayNumber, nextAction, planFinished, sanitizePlan, week } from './planLogic'
import type { Plan, PlanCounts } from './planLogic'

const NOW = new Date(2026, 10, 13, 10, 0, 0) // 13/11/2026 10:00 local

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    serviceKey: 'site-institucional',
    city: 'Curitiba',
    dailyGoal: 5,
    startedOn: '2026-11-13',
    readyAt: '2026-11-13T12:00:00.000Z',
    log: {},
    ...overrides,
  }
}

const NONE: PlanCounts = { novos: 0, aguardando: 0, responderam: 0, retornosDevidos: 0 }

describe('datas do plano', () => {
  it('formata e soma dias no calendário local', () => {
    expect(dateKey(NOW)).toBe('2026-11-13')
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('conta o dia do plano a partir de 1 e passa de 7 quando termina', () => {
    expect(dayNumber(plan(), NOW)).toBe(1)
    expect(dayNumber(plan({ startedOn: '2026-11-10' }), NOW)).toBe(4)
    expect(planFinished(plan({ startedOn: '2026-11-07' }), NOW)).toBe(false)
    expect(planFinished(plan({ startedOn: '2026-11-06' }), NOW)).toBe(true)
  })
})

describe('próxima ação', () => {
  it('começa pela mensagem pronta', () => {
    const action = nextAction(plan({ readyAt: undefined }), { ...NONE, novos: 9 }, NOW)
    expect(action.kind).toBe('ready')
  })

  it('quem respondeu vem antes de abordar gente nova', () => {
    const action = nextAction(plan(), { ...NONE, novos: 4, responderam: 2 }, NOW)
    expect(action.kind).toBe('reply')
    expect(action.title).toBe('2 pessoas responderam')
  })

  it('manda abordar quando há fila e meta pendente, com progresso do dia', () => {
    const p = bump(plan(), 'abordagens', NOW, 2)
    const action = nextAction(p, { ...NONE, novos: 6 }, NOW)
    expect(action.kind).toBe('contact')
    expect(action.title).toBe('Aborde 3 negócios hoje')
    expect(action.progress).toEqual({ value: 2, max: 5 })
  })

  it('manda achar negócios quando a fila está vazia', () => {
    const action = nextAction(plan(), NONE, NOW)
    expect(action.kind).toBe('find')
    expect(action.to).toBe('/clientes?aba=achar')
  })

  it('depois da meta, cobra retornos e então encerra o dia', () => {
    const met = bump(plan(), 'abordagens', NOW, 5)
    expect(nextAction(met, { ...NONE, retornosDevidos: 1 }, NOW).kind).toBe('followup')
    expect(nextAction(met, NONE, NOW).kind).toBe('done')
  })
})

describe('faixa da semana', () => {
  it('marca o dia 1 como feito e o dia de hoje como atual', () => {
    const days = week(plan({ startedOn: '2026-11-12', readyAt: undefined }), NOW)
    expect(days).toHaveLength(7)
    expect(days[0]?.state).toBe('feito')
    expect(days[1]?.state).toBe('hoje')
    expect(days[2]?.state).toBe('futuro')
  })

  it('dias de abordagem só contam com a meta cumprida naquele dia', () => {
    const start = '2026-11-09'
    const day4 = addDays(start, 3) // 12/11
    const p = plan({ startedOn: start, log: { [day4]: { abordagens: 5, followups: 0, salvos: 0 } } })
    const days = week(p, NOW)
    expect(days[3]?.state).toBe('feito')
    expect(days[4]?.state).toBe('hoje')
  })

  it('mensagem e busca atrasadas ficam pendentes, abordagem perdida fica como passou', () => {
    const days = week(plan({ startedOn: '2026-11-08', readyAt: undefined }), NOW)
    expect(days[1]?.state).toBe('pendente')
    expect(days[2]?.state).toBe('pendente')
    expect(days[3]?.state).toBe('perdido')
  })
})

describe('validação do plano', () => {
  it('rejeita lixo e saneia números', () => {
    expect(sanitizePlan(null)).toBeNull()
    expect(sanitizePlan({ serviceKey: '', startedOn: '2026-11-13' })).toBeNull()
    expect(sanitizePlan({ serviceKey: 'x', startedOn: 'ontem' })).toBeNull()

    const clean = sanitizePlan({
      serviceKey: 'site-institucional',
      startedOn: '2026-11-13',
      dailyGoal: 9999,
      city: 'Curitiba',
      log: { '2026-11-13': { abordagens: -4, followups: 'x', salvos: 3 }, lixo: { abordagens: 1 } },
    })
    expect(clean?.dailyGoal).toBe(30)
    expect(clean?.log['2026-11-13']).toEqual({ abordagens: 0, followups: 0, salvos: 3 })
    expect(Object.keys(clean?.log ?? {})).toEqual(['2026-11-13'])
  })
})
