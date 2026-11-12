import { createContext, useContext } from 'react'
import type { UserPreferences } from '@/types/domain'

export interface PreferencesContextValue {
  preferences: UserPreferences
  resolvedTheme: 'dark' | 'light'
  update: (patch: Partial<UserPreferences>) => void
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences precisa estar dentro de <PreferencesProvider>.')
  return context
}
