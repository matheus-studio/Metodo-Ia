import { describe, expect, it } from 'vitest'
import { CATALOG } from '@/features/catalog/catalogData'
import type { CompanyLead, Deal } from '@/types/domain'
import {
  RAMOS,
  buildLeads,
  countPipeline,
  draftFor,
  etapaOf,
  followupAt,
  isFollowupDue,
  presenceFor,
  searchLinks,
  suggestedRamos,
} from './clientsLogic'

const NOW = new Date('2026-11-13T15:00:00.000Z')
const DAY = 86_400_000

function deal(overrides: Partial<Deal>): Deal {
  return {
    id: 'd1',
    title: 'Serviço — Padaria',
    stage: 'novo',
    createdAt: '2026-11-10T10:00:00.000Z',
    updatedAt: '2026-11-10T10:00:00.000Z',
    ...overrides,
  }
}

const company: CompanyLead = {
  id: 'c1',
  name: 'Padaria Sol',
  segment: 'Alimentação',
  city: 'Curitiba',
  phone: '(41) 99999-0000',
  digitalPresence: 'site-nao-confirmado',
  source: 'manual',
  notes: 'O último post do perfil é de 2024.',
  createdAt: '2026-11-10T10:00:00.000Z',
  updatedAt: '2026-11-10T10:00:00.000Z',
}

describe('buscas', () => {
  it('monta links de fontes públicas com o termo e a cidade codificados', () => {
    const links = searchLinks('salão de beleza', 'São José dos Pinhais')
    expect(links.maps).toBe('https://www.google.com/maps/search/sal%C3%A3o%20de%20beleza%20em%20S%C3%A3o%20Jos%C3%A9%20dos%20Pinhais')
    expect(links.instagram).toContain('site%3Ainstagram.com')
    expect(searchLinks('pet shop', '').google).toContain('pet%20shop')
    expect(searchLinks('pet shop', '').google).not.toContain('%20em%20')
  })

  it('todo ramo tem termos de busca e chave única', () => {
    const keys = RAMOS.map((ramo) => ramo.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const ramo of RAMOS) expect(ramo.terms.length).toBeGreaterThan(2)
  })

  it('sugere ramos a partir dos segmentos do serviço e não quebra sem serviço', () => {
    const cardapio = CATALOG.find((item) => item.key === 'cardapio-digital')
    expect(suggestedRamos(cardapio)).toContain('alimentacao')
    expect(suggestedRamos(undefined)).toEqual([])
  })
})

describe('presença digital', () => {
  it('não transforma "não achei" em "não tem"', () => {
    expect(presenceFor('tem')).toBe('site-identificado')
    expect(presenceFor('nao-achei')).toBe('site-nao-cadastrado')
    expect(presenceFor('nao-verifiquei')).toBe('site-nao-confirmado')
  })
})

describe('fila e retornos', () => {
  it('agrupa negociação em proposta e conta cada etapa', () => {
    expect(etapaOf('negociacao')).toBe('proposta')
    const counts = countPipeline(
      [
        deal({ id: '1', stage: 'novo' }),
        deal({ id: '2', stage: 'novo' }),
        deal({ id: '3', stage: 'respondeu' }),
        deal({ id: '4', stage: 'negociacao' }),
        deal({ id: '5', stage: 'fechado', potentialValue: 800 }),
        deal({ id: '6', stage: 'fechado' }),
        deal({ id: '7', stage: 'perdido' }),
      ],
      NOW,
    )
    expect(counts).toMatchObject({ novos: 2, responderam: 1, propostas: 1, fechados: 2, valorFechado: 800 })
  })

  it('o retorno vence depois do prazo e só vale para quem foi abordado', () => {
    const future = new Date(NOW.getTime() + DAY).toISOString()
    const past = new Date(NOW.getTime() - DAY).toISOString()
    expect(isFollowupDue(deal({ stage: 'contatado', nextActionAt: future }), NOW)).toBe(false)
    expect(isFollowupDue(deal({ stage: 'contatado', nextActionAt: past }), NOW)).toBe(true)
    expect(isFollowupDue(deal({ stage: 'novo', nextActionAt: past }), NOW)).toBe(false)
    // Sem data marcada: dois dias depois da última atualização.
    expect(isFollowupDue(deal({ stage: 'contatado', updatedAt: '2026-11-10T10:00:00.000Z' }), NOW)).toBe(true)
    expect(followupAt(NOW)).toBe(new Date(NOW.getTime() + 2 * DAY).toISOString())
  })

  it('une negociação e empresa e ordena pela mais recente', () => {
    const leads = buildLeads(
      [deal({ id: 'a', companyId: 'c1', updatedAt: '2026-11-11T00:00:00.000Z' }), deal({ id: 'b', title: 'Sem empresa', updatedAt: '2026-11-12T00:00:00.000Z' })],
      [company],
    )
    expect(leads.map((lead) => lead.deal.id)).toEqual(['b', 'a'])
    expect(leads[1]?.name).toBe('Padaria Sol')
    expect(leads[0]?.name).toBe('Sem empresa')
  })
})

describe('mensagem', () => {
  const service = CATALOG.find((item) => item.key === 'cardapio-digital')
  const lead = buildLeads([deal({ companyId: 'c1' })], [company])[0]!

  it('usa só a observação que o usuário escreveu e avisa para conferir', () => {
    const draft = draftFor({ lead, service, senderName: 'Ana', channel: 'whatsapp', now: NOW })
    expect(draft.body).toContain('Sou Ana')
    expect(draft.body).toContain('O último post do perfil é de 2024.')
    expect(draft.warnings.join(' ')).toMatch(/confirme/i)
  })

  it('não inventa observação quando não há nota', () => {
    const semNota = buildLeads([deal({ companyId: 'c1' })], [{ ...company, notes: undefined }])[0]!
    const draft = draftFor({ lead: semNota, service, channel: 'whatsapp', now: NOW })
    expect(draft.body).not.toMatch(/não tem site|sem site/i)
    expect(draft.warnings).toEqual([])
  })

  it('o retorno cita os dias desde o contato e não repete a observação', () => {
    const contatado = buildLeads([deal({ stage: 'contatado', companyId: 'c1', updatedAt: '2026-11-10T15:00:00.000Z' })], [company])[0]!
    const draft = draftFor({ lead: contatado, service, channel: 'followup', now: NOW })
    expect(draft.body).toContain('3 dia(s)')
    expect(draft.body).not.toContain('último post')
  })
})
