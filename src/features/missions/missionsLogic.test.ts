import { describe, expect, it } from 'vitest'
import type { ActivityEntry, ActivityKind } from '@/types/domain'
import { countByKind, summarizeWeek, weeklyMissions, weekRange } from './missionsLogic'

function entry(kind: ActivityKind, createdAt: string): ActivityEntry {
  return { id: `${kind}-${createdAt}`, createdAt, updatedAt: createdAt, kind, message: kind }
}

// Quarta-feira, 14 de outubro de 2026, meio-dia.
const reference = new Date(2026, 9, 14, 12, 0, 0)

describe('weekRange', () => {
  it('abre na segunda-feira e fecha no domingo', () => {
    const range = weekRange(reference)
    expect(range.start.getDay()).toBe(1)
    expect(range.start.getDate()).toBe(12)
    expect(range.end.getDate()).toBe(19)
    expect(range.label).toBe('12/10 a 18/10')
  })

  it('trata domingo como fim da semana corrente, não início da seguinte', () => {
    const domingo = new Date(2026, 9, 18, 20, 0, 0)
    expect(weekRange(domingo).start.getDate()).toBe(12)
  })
})

describe('countByKind', () => {
  it('conta apenas o que caiu dentro da semana', () => {
    const range = weekRange(reference)
    const activities = [
      entry('oportunidade-salva', new Date(2026, 9, 13, 9).toISOString()),
      entry('oportunidade-salva', new Date(2026, 9, 14, 9).toISOString()),
      entry('oportunidade-salva', new Date(2026, 9, 5, 9).toISOString()),
    ]
    expect(countByKind(activities, range)['oportunidade-salva']).toBe(2)
  })
})

describe('weeklyMissions', () => {
  it('começa a semana com tudo zerado', () => {
    const missions = weeklyMissions([], reference)
    expect(missions.every((mission) => mission.progress === 0 && !mission.done)).toBe(true)
    expect(missions.length).toBeGreaterThanOrEqual(5)
  })

  it('marca como feita só ao atingir a meta', () => {
    const atividades = [
      entry('oportunidade-salva', new Date(2026, 9, 13, 9).toISOString()),
      entry('oportunidade-salva', new Date(2026, 9, 13, 10).toISOString()),
    ]
    const parcial = weeklyMissions(atividades, reference).find((mission) => mission.key === 'oportunidades')
    expect(parcial?.progress).toBe(2)
    expect(parcial?.done).toBe(false)

    const completa = weeklyMissions(
      [...atividades, entry('oportunidade-salva', new Date(2026, 9, 14, 8).toISOString())],
      reference,
    ).find((mission) => mission.key === 'oportunidades')
    expect(completa?.done).toBe(true)
  })

  it('ignora atividade da semana passada', () => {
    const missions = weeklyMissions([entry('oferta-criada', new Date(2026, 9, 1, 9).toISOString())], reference)
    expect(missions.find((mission) => mission.key === 'oferta')?.progress).toBe(0)
  })
})

describe('summarizeWeek', () => {
  it('aponta como foco a missão com menor progresso relativo', () => {
    const missions = weeklyMissions(
      [
        entry('oportunidade-salva', new Date(2026, 9, 13, 9).toISOString()),
        entry('oportunidade-salva', new Date(2026, 9, 13, 10).toISOString()),
        entry('servico-criado', new Date(2026, 9, 13, 11).toISOString()),
      ],
      reference,
    )
    const summary = summarizeWeek(missions)
    expect(summary.completed).toBeGreaterThanOrEqual(1)
    expect(summary.focus?.progress).toBe(0)
  })

  it('não aponta foco quando tudo está concluído', () => {
    const missions = weeklyMissions([], reference).map((mission) => ({ ...mission, done: true }))
    const summary = summarizeWeek(missions)
    expect(summary.focus).toBeNull()
    expect(summary.percent).toBe(100)
  })

  it('não inventa pontuação nem nível', () => {
    const summary = summarizeWeek(weeklyMissions([], reference))
    expect(summary).not.toHaveProperty('points')
    expect(summary).not.toHaveProperty('level')
  })
})
