import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { readPreferences, writePreferences } from '@/storage/preferences'
import type { UserPreferences } from '@/types/domain'
import { PreferencesContext } from './preferencesContext'
import type { PreferencesContextValue } from './preferencesContext'

function systemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => readPreferences())
  const [system, setSystem] = useState<'dark' | 'light'>(() => systemTheme())

  useEffect(() => {
    if (!window.matchMedia) return
    const query = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = (event: MediaQueryListEvent) => setSystem(event.matches ? 'light' : 'dark')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme = preferences.theme === 'system' ? system : preferences.theme

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  const update = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch }
      writePreferences(next)
      return next
    })
  }, [])

  const value = useMemo<PreferencesContextValue>(
    () => ({ preferences, resolvedTheme, update }),
    [preferences, resolvedTheme, update],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
