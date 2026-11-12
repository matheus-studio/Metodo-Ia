import { BillingNotConfiguredError } from './types'
import type { AccessGate, BillingPort, EntitlementKey, Entitlements } from './types'

/**
 * Implementação local, usada enquanto não há conta nem servidor.
 *
 * Ela libera tudo o que existe hoje — porque hoje tudo é local e gratuito — e
 * recusa explicitamente qualquer operação de cobrança, em vez de simular uma.
 * Um checkout falso seria pior do que nenhum: daria a impressão de que a parte
 * difícil está resolvida.
 */

const LOCAL_ENTITLEMENTS: Entitlements = {
  planId: 'gratuito',
  granted: ['biblioteca-completa', 'exportacao-avancada'],
}

const REASONS: Record<EntitlementKey, string | null> = {
  'biblioteca-completa': null,
  'exportacao-avancada': null,
  'radar-empresas': 'O Radar de empresas reais depende de uma fonte de dados autorizada e de um servidor (Marco 3).',
  sincronizacao: 'Sincronizar entre aparelhos exige conta e servidor. Hoje a forma de levar os dados é o backup.',
}

export function createLocalAccessGate(entitlements: Entitlements = LOCAL_ENTITLEMENTS): AccessGate {
  return {
    can(feature) {
      return entitlements.granted.includes(feature)
    },
    reasonFor(feature) {
      if (entitlements.granted.includes(feature)) return null
      return REASONS[feature] ?? 'Recurso ainda não disponível nesta versão.'
    },
  }
}

export const localBillingPort: BillingPort = {
  async loadEntitlements() {
    return LOCAL_ENTITLEMENTS
  },
  async startCheckout() {
    throw new BillingNotConfiguredError('iniciar checkout')
  },
  async loadSubscription() {
    return null
  },
  async openCustomerPortal() {
    throw new BillingNotConfiguredError('abrir o portal do assinante')
  },
}
