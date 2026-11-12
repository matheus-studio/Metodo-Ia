import { DEFAULT_PREFERENCES } from '@/types/domain'
import type { UserPreferences } from '@/types/domain'

const KEY = 'metodo-ia-pro:preferences'

function isTheme(value: unknown): value is UserPreferences['theme'] {
  return value === 'dark' || value === 'light' || value === 'system'
}

/**
 * Preferências ficam em localStorage (leitura síncrona no primeiro paint evita
 * piscar o tema), sempre validadas: o conteúdo é entrada não confiável.
 */
export function readPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PREFERENCES }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_PREFERENCES }
    const candidate = parsed as Record<string, unknown>
    return {
      theme: isTheme(candidate.theme) ? candidate.theme : DEFAULT_PREFERENCES.theme,
      displayName: typeof candidate.displayName === 'string' ? candidate.displayName.slice(0, 80) : undefined,
      hourlyRate:
        typeof candidate.hourlyRate === 'number' && Number.isFinite(candidate.hourlyRate) && candidate.hourlyRate >= 0
          ? candidate.hourlyRate
          : undefined,
      weeklyGoalContacts:
        typeof candidate.weeklyGoalContacts === 'number' && Number.isFinite(candidate.weeklyGoalContacts)
          ? Math.min(500, Math.max(0, Math.round(candidate.weeklyGoalContacts)))
          : DEFAULT_PREFERENCES.weeklyGoalContacts,
      skills: Array.isArray(candidate.skills)
        ? candidate.skills.filter((s): s is string => typeof s === 'string').slice(0, 40)
        : [],
      onboardingDone: candidate.onboardingDone === true,
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export function writePreferences(preferences: UserPreferences): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(preferences))
    return true
  } catch {
    return false
  }
}

export const PREFERENCES_KEY = KEY
