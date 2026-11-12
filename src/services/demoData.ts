import { logActivity, repositories } from '@/repositories'
import type { RepositoryKey } from '@/repositories'

/**
 * Dados de demonstração.
 *
 * Regras que esta função respeita, e que valem para o produto inteiro:
 * 1. Nenhum registro aqui imita resultado de API. São empresas explicitamente
 *    fictícias, com "(demonstração)" no próprio nome e `source: 'manual'`.
 * 2. Todo id começa com "demo-", o que permite remover tudo depois sem tocar
 *    nos dados reais do usuário.
 * 3. A interface sinaliza no painel enquanto houver demonstração ativa.
 */

const DEMO_PREFIX = 'demo-'

export function isDemoRecord(id: string): boolean {
  return id.startsWith(DEMO_PREFIX)
}

export async function loadDemoData(): Promise<void> {
  await repositories.companies.put({
    id: `${DEMO_PREFIX}empresa-1`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Cantina do Bairro (demonstração)',
    segment: 'Alimentação',
    city: 'Curitiba',
    digitalPresence: 'site-nao-confirmado',
    source: 'manual',
    notes: 'Registro de demonstração — não corresponde a uma empresa real.',
  })

  await repositories.companies.put({
    id: `${DEMO_PREFIX}empresa-2`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Studio Pilates Exemplo (demonstração)',
    segment: 'Saúde e bem-estar',
    city: 'Curitiba',
    digitalPresence: 'site-identificado',
    website: 'https://exemplo.invalid',
    source: 'manual',
    notes: 'Registro de demonstração — não corresponde a uma empresa real.',
  })

  await repositories.blueprints.put({
    id: `${DEMO_PREFIX}servico-1`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Site institucional com cardápio digital',
    problem: 'Restaurantes locais sem página própria dependem só de redes sociais para serem encontrados.',
    audience: 'Restaurantes e cafés de bairro',
    deliverables: ['Site de uma página', 'Cardápio digital atualizável', 'Botão de WhatsApp', 'Mapa e horários'],
    tools: ['Construtor de sites', 'Editor de imagens', 'Domínio e hospedagem'],
    steps: ['Briefing', 'Coleta de fotos e cardápio', 'Montagem', 'Revisão com o cliente', 'Publicação'],
    estimatedHours: 12,
    risks: ['Cliente sem fotos próprias', 'Cardápio desatualizado na entrega'],
    status: 'pronto',
  })

  await repositories.offers.put({
    id: `${DEMO_PREFIX}oferta-1`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Presença digital para restaurantes',
    clientOrSegment: 'Restaurantes de bairro',
    blueprintId: `${DEMO_PREFIX}servico-1`,
    deliverables: ['Site de uma página', 'Cardápio digital', 'Configuração de contato'],
    clientResponsibilities: ['Envio do cardápio atualizado', 'Envio de fotos dos pratos'],
    differentials: ['Treinamento de atualização incluído'],
    nextSteps: ['Aprovação da proposta', 'Envio do material', 'Início da montagem'],
    currency: 'BRL',
    deadlineDays: 10,
    status: 'rascunho',
  })

  await repositories.contacts.put({
    id: `${DEMO_PREFIX}contato-1`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Responsável — Cantina do Bairro (demonstração)',
    companyId: `${DEMO_PREFIX}empresa-1`,
    notes: 'Contato fictício, criado apenas para demonstrar a interface.',
  })

  await repositories.deals.put({
    id: `${DEMO_PREFIX}negociacao-1`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: 'Cantina do Bairro — site com cardápio',
    stage: 'novo',
    companyId: `${DEMO_PREFIX}empresa-1`,
    contactId: `${DEMO_PREFIX}contato-1`,
    offerId: `${DEMO_PREFIX}oferta-1`,
  })

  await repositories.opportunities.put({
    id: `${DEMO_PREFIX}oportunidade-1`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    serviceKey: 'site-institucional',
    title: 'Site institucional para negócios locais',
    segment: 'Alimentação',
  })

  await logActivity({ kind: 'demo-carregada', message: 'Dados de demonstração carregados.' })
}

/** Remove apenas o que foi criado como demonstração. */
export async function removeDemoData(): Promise<number> {
  const keys: RepositoryKey[] = [
    'companies',
    'opportunities',
    'blueprints',
    'offers',
    'contacts',
    'deals',
    'projects',
    'tasks',
  ]
  let removed = 0
  for (const key of keys) {
    const rows = await repositories[key].list()
    for (const row of rows) {
      if (isDemoRecord(row.id)) {
        await repositories[key].remove(row.id)
        removed += 1
      }
    }
  }
  await logActivity({ kind: 'demo-removida', message: `Dados de demonstração removidos (${removed} registros).` })
  return removed
}
