import { describe, expect, it } from 'vitest'
import { createLocalAccessGate, localBillingPort } from './localAccess'
import { BillingNotConfiguredError } from './types'

describe('acesso local (sem conta nem servidor)', () => {
  const gate = createLocalAccessGate()

  it('libera o que existe hoje', () => {
    expect(gate.can('biblioteca-completa')).toBe(true)
    expect(gate.can('exportacao-avancada')).toBe(true)
  })

  it('nega o que depende de servidor, com motivo explicável na interface', () => {
    expect(gate.can('radar-empresas')).toBe(false)
    expect(gate.reasonFor('radar-empresas')).toContain('servidor')
    expect(gate.reasonFor('sincronizacao')).toContain('backup')
  })

  it('não devolve motivo para recurso liberado', () => {
    expect(gate.reasonFor('biblioteca-completa')).toBeNull()
  })

  // Um checkout simulado passaria a impressão de que a cobrança está pronta.
  it('recusa cobrança em vez de simular', async () => {
    await expect(localBillingPort.startCheckout({ planId: 'completo', returnUrl: '/' })).rejects.toBeInstanceOf(
      BillingNotConfiguredError,
    )
    await expect(localBillingPort.openCustomerPortal()).rejects.toBeInstanceOf(BillingNotConfiguredError)
  })

  it('não inventa assinatura ativa', async () => {
    expect(await localBillingPort.loadSubscription()).toBeNull()
    expect((await localBillingPort.loadEntitlements()).planId).toBe('gratuito')
  })
})
