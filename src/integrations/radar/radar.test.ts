import { describe, expect, it } from 'vitest'
import { notConfiguredRadar } from './notConfigured'
import { RadarNotConfiguredError } from './types'
import type { RadarResult, RadarSource } from './types'

const fonteRestritiva: RadarSource = {
  key: 'exemplo',
  name: 'Fonte de exemplo',
  attribution: 'Dados da Fonte de exemplo',
  retention: {
    // Fonte que permite guardar só a referência e o nome.
    storableFields: ['sourceRef', 'name'],
    maxDays: 30,
    note: 'Somente referência e nome podem ser persistidos.',
  },
}

const resultado: RadarResult = {
  sourceRef: 'ref-1',
  name: 'Empresa Exemplo',
  category: 'Alimentação',
  address: 'Rua Um, 100',
  phone: '4133334444',
  website: 'https://exemplo.invalid',
  digitalPresence: 'site-identificado',
  checkedAt: '2026-10-14T12:00:00.000Z',
}

describe('Radar sem fonte configurada', () => {
  it('declara que não está configurado', () => {
    expect(notConfiguredRadar.isConfigured()).toBe(false)
    expect(notConfiguredRadar.describeSource()).toBeNull()
  })

  // Lista vazia faria o usuário acreditar que pesquisou e não encontrou nada.
  it('recusa a busca em vez de devolver lista vazia ou exemplo', async () => {
    await expect(notConfiguredRadar.search({ city: 'Curitiba', segment: 'Restaurantes', limit: 10 })).rejects.toBeInstanceOf(
      RadarNotConfiguredError,
    )
  })

  it('ao converter para o CRM, guarda apenas o que a licença da fonte permite', () => {
    const lead = notConfiguredRadar.toCompanyLead(resultado, fonteRestritiva)
    expect(lead.name).toBe('Empresa Exemplo')
    expect(lead.sourceRef).toBe('ref-1')
    // Telefone, endereço e site não estão na lista de campos persistíveis.
    expect(lead.phone).toBeUndefined()
    expect(lead.address).toBeUndefined()
    expect(lead.website).toBeUndefined()
    expect(lead.source).toBe('provedor-externo')
  })

  it('marca a origem externa, separando do cadastro manual do usuário', () => {
    const lead = notConfiguredRadar.toCompanyLead(resultado, fonteRestritiva)
    expect(lead.sourceName).toBe('Fonte de exemplo')
    expect(lead.checkedAt).toBe(resultado.checkedAt)
  })
})
