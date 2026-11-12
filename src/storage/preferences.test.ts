import { describe, expect, it } from 'vitest'
import { PREFERENCES_KEY, readPreferences, writePreferences } from './preferences'

describe('preferências', () => {
  it('retorna o padrão quando não há nada salvo', () => {
    expect(readPreferences().theme).toBe('dark')
    expect(readPreferences().onboardingDone).toBe(false)
  })

  it('sobrevive a conteúdo corrompido no localStorage', () => {
    localStorage.setItem(PREFERENCES_KEY, '{{{ não é json')
    expect(readPreferences().theme).toBe('dark')
  })

  // O conteúdo do localStorage é entrada não confiável: outra aba, uma extensão
  // ou o próprio usuário podem tê-lo alterado.
  it('descarta campos com tipo inesperado', () => {
    localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ theme: 'arco-íris', hourlyRate: 'muito', skills: ['ok', 42], weeklyGoalContacts: -10 }),
    )
    const prefs = readPreferences()
    expect(prefs.theme).toBe('dark')
    expect(prefs.hourlyRate).toBeUndefined()
    expect(prefs.skills).toEqual(['ok'])
    expect(prefs.weeklyGoalContacts).toBe(0)
  })

  it('limita a meta semanal a um intervalo plausível', () => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ weeklyGoalContacts: 99999 }))
    expect(readPreferences().weeklyGoalContacts).toBe(500)
  })

  it('grava e relê o que foi definido', () => {
    writePreferences({ theme: 'light', skills: ['sites'], onboardingDone: true, weeklyGoalContacts: 12 })
    const prefs = readPreferences()
    expect(prefs.theme).toBe('light')
    expect(prefs.skills).toEqual(['sites'])
    expect(prefs.weeklyGoalContacts).toBe(12)
  })
})
