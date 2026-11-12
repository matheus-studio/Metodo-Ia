import type { CompanyLead, DigitalPresence } from '@/types/domain'

/**
 * Contratos do Radar de empresas reais (Marco 3).
 *
 * O módulo está **isolado de propósito**: nada no aplicativo depende dele, e a
 * ausência de uma fonte configurada não quebra nenhuma outra tela. O que existe
 * aqui é o contrato que a implementação futura precisa cumprir, mais uma
 * implementação que recusa a busca em vez de inventar resultados.
 *
 * Três regras não negociáveis para quem for implementar:
 * 1. A consulta sai do servidor. Chave de API no navegador é chave publicada.
 * 2. "Sem website na fonte" nunca vira "a empresa não tem site" (ver
 *    `DigitalPresence`): são estados diferentes e a interface precisa mostrar
 *    a diferença ao usuário.
 * 3. A política de retenção vem da licença da fonte, não da conveniência do
 *    produto. `RadarSource.retention` existe para isso.
 */

export interface RadarQuery {
  city: string
  segment: string
  /** Teto de resultados: protege contra custo inesperado por consulta. */
  limit: number
}

export interface RadarResult {
  /** Identificador na fonte — só é persistido quando a licença permitir. */
  sourceRef: string
  name: string
  category?: string
  address?: string
  /** Telefone comercial público, quando a fonte o fornecer legitimamente. */
  phone?: string
  website?: string
  digitalPresence: DigitalPresence
  /** Link para o registro na fonte, para o usuário conferir. */
  sourceUrl?: string
  checkedAt: string
}

export interface RadarResponse {
  results: RadarResult[]
  source: RadarSource
  /** Quantas consultas restam no período, quando a fonte impuser cota. */
  remainingQuota?: number
}

export interface RadarSource {
  key: string
  name: string
  /** Texto de atribuição exigido pela licença, exibido junto aos resultados. */
  attribution: string
  retention: {
    /** O que pode ser guardado no dispositivo do usuário. */
    storableFields: (keyof RadarResult)[]
    /** Dias de retenção permitidos; `null` = sem limite declarado. */
    maxDays: number | null
    note: string
  }
}

export interface RadarPort {
  /** Diz se há fonte configurada — a interface pergunta antes de oferecer busca. */
  isConfigured(): boolean
  describeSource(): RadarSource | null
  search(query: RadarQuery): Promise<RadarResponse>
  /** Converte um resultado em empresa do CRM, respeitando a retenção da fonte. */
  toCompanyLead(result: RadarResult, source: RadarSource): Omit<CompanyLead, 'id' | 'createdAt' | 'updatedAt'>
}

export class RadarNotConfiguredError extends Error {
  constructor() {
    super(
      'Radar de empresas reais não configurado: é preciso uma fonte de dados autorizada e um servidor que guarde a credencial. Ver docs/radar.md.',
    )
    this.name = 'RadarNotConfiguredError'
  }
}
