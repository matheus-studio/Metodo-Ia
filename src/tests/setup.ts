import '@testing-library/jest-dom/vitest'
// IndexedDB real não existe no jsdom: a implementação em memória exercita o
// mesmo caminho de código que o navegador usa, sem mocks do repositório.
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { repositories } from '@/repositories'
import { PLAN_KEY } from '@/features/plan/planLogic'
import { writePlan } from '@/features/plan/planStore'
import { PREFERENCES_KEY } from '@/storage/preferences'

beforeEach(async () => {
  localStorage.removeItem(PREFERENCES_KEY)
  localStorage.removeItem(PLAN_KEY)
  writePlan(null)
  for (const repository of Object.values(repositories)) {
    await repository.clear()
  }
})

afterEach(() => {
  cleanup()
})
