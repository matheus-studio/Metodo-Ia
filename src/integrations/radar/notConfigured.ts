import { RadarNotConfiguredError } from './types'
import type { RadarPort, RadarResult, RadarSource } from './types'

/**
 * Implementação padrão enquanto não há fonte contratada.
 *
 * Ela recusa a busca. Não devolve lista vazia fingindo que "não achou nada",
 * nem dados de exemplo: as duas coisas fariam o usuário acreditar que
 * pesquisou empresas reais.
 */
export const notConfiguredRadar: RadarPort = {
  isConfigured() {
    return false
  },
  describeSource() {
    return null
  },
  async search() {
    throw new RadarNotConfiguredError()
  },
  toCompanyLead(result: RadarResult, source: RadarSource) {
    // Só os campos que a licença da fonte permite guardar.
    const allowed = new Set<string>(source.retention.storableFields as string[])
    return {
      name: result.name,
      segment: result.category ?? 'Não informado',
      city: 'Não informada',
      address: allowed.has('address') ? result.address : undefined,
      phone: allowed.has('phone') ? result.phone : undefined,
      website: allowed.has('website') ? result.website : undefined,
      digitalPresence: result.digitalPresence,
      source: 'provedor-externo' as const,
      sourceRef: allowed.has('sourceRef') ? result.sourceRef : undefined,
      sourceName: source.name,
      checkedAt: result.checkedAt,
    }
  },
}
