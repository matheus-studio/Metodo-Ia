import { useSyncExternalStore } from 'react'
import { PLAN_KEY, sanitizePlan } from './planLogic'
import type { Plan } from './planLogic'

/**
 * Armazena o plano em localStorage (leitura síncrona, poucos bytes) e avisa as
 * telas por um barramento mínimo. Se o armazenamento estiver bloqueado, o plano
 * vive só em memória até fechar o app — o mesmo comportamento das preferências.
 */

const listeners = new Set<() => void>()
let memory: Plan | null = null
let cacheRaw: string | null | undefined
let cacheValue: Plan | null = null

function readRaw(): string | null {
  try {
    return localStorage.getItem(PLAN_KEY)
  } catch {
    return null
  }
}

export function readPlan(): Plan | null {
  const raw = readRaw()
  if (raw === null) return memory
  if (raw === cacheRaw) return cacheValue
  cacheRaw = raw
  try {
    cacheValue = sanitizePlan(JSON.parse(raw))
  } catch {
    cacheValue = null
  }
  return cacheValue
}

function emit(): void {
  for (const listener of listeners) listener()
}

export function writePlan(plan: Plan | null): void {
  memory = plan
  try {
    if (plan) localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
    else localStorage.removeItem(PLAN_KEY)
  } catch {
    // Sem armazenamento: o plano continua em memória.
  }
  cacheRaw = undefined
  emit()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePlan(): Plan | null {
  return useSyncExternalStore(subscribe, readPlan, () => null)
}

/** Atualiza o plano atual com uma função pura; ignora se não houver plano. */
export function updatePlan(change: (plan: Plan) => Plan): void {
  const current = readPlan()
  if (current) writePlan(change(current))
}
