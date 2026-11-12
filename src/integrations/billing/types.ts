/**
 * Contratos de conta, compra e acesso a produto pago.
 *
 * Isto é só o contrato — não há integração, e não deve haver enquanto não
 * existir servidor. O propósito de escrever as interfaces agora é garantir que
 * os módulos já construídos não precisem ser refeitos quando a cobrança entrar:
 * quem precisar saber se um recurso está liberado pergunta ao `AccessGate`, e
 * hoje a resposta vem de uma implementação local que libera tudo.
 *
 * Três regras que a implementação futura precisa obedecer:
 * 1. Nenhuma chave secreta no frontend. Checkout e webhook ficam no servidor.
 * 2. O acesso é decidido pelo servidor. Esconder botão no navegador não é
 *    controle de acesso — é enfeite.
 * 3. O evento de pagamento só vale depois de validado na origem (assinatura do
 *    webhook). Confiar no retorno do navegador é como aceitar comprovante
 *    enviado pelo próprio comprador.
 */

export type PlanId = 'gratuito' | 'completo'

export type EntitlementKey =
  | 'radar-empresas'
  | 'biblioteca-completa'
  | 'exportacao-avancada'
  | 'sincronizacao'

export interface Account {
  id: string
  email: string
  createdAt: string
}

export interface Subscription {
  planId: PlanId
  status: 'ativa' | 'pendente' | 'cancelada' | 'expirada'
  /** Fim do período já pago. Depois disso o acesso cai para o gratuito. */
  currentPeriodEnd?: string
}

export interface Entitlements {
  planId: PlanId
  granted: EntitlementKey[]
}

/** Resposta do servidor sobre o que esta sessão pode usar. */
export interface AccessGate {
  can(feature: EntitlementKey): boolean
  /** Motivo da negativa, para a interface explicar em vez de só bloquear. */
  reasonFor(feature: EntitlementKey): string | null
}

export interface CheckoutRequest {
  planId: PlanId
  /** Para onde o provedor devolve o usuário. Nunca carrega concessão de acesso. */
  returnUrl: string
}

export interface CheckoutSession {
  /** URL hospedada pelo provedor de pagamento. O app apenas redireciona. */
  url: string
  expiresAt: string
}

export interface BillingPort {
  /** Estado atual, sempre vindo do servidor. */
  loadEntitlements(): Promise<Entitlements>
  startCheckout(request: CheckoutRequest): Promise<CheckoutSession>
  loadSubscription(): Promise<Subscription | null>
  openCustomerPortal(): Promise<{ url: string }>
}

export class BillingNotConfiguredError extends Error {
  constructor(action: string) {
    super(
      `Cobrança não configurada: "${action}" exige um servidor com as credenciais do provedor. Ver docs/comercial.md.`,
    )
    this.name = 'BillingNotConfiguredError'
  }
}
