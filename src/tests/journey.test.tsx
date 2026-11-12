import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/app/PreferencesProvider'
import { AppRoutes } from '@/app/router'
import { repositories } from '@/repositories'
import type { ServiceBlueprint } from '@/types/domain'

function renderAt(route: string) {
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </PreferencesProvider>,
  )
}

async function seedBlueprint(): Promise<ServiceBlueprint> {
  return repositories.blueprints.create({
    name: 'Site institucional com cardápio',
    problem: 'O restaurante só existe em rede social.',
    audience: 'Restaurantes de bairro',
    deliverables: ['Página publicada', 'Cardápio digital'],
    tools: ['Construtor de sites'],
    steps: ['Briefing', 'Montagem', 'Publicação'],
    estimatedHours: 12,
    risks: ['Cliente sem fotos'],
    status: 'pronto',
  })
}

describe('catálogo de serviços', () => {
  it('lista serviços e filtra pela busca', async () => {
    const user = userEvent.setup()
    renderAt('/radar/servicos')

    expect(await screen.findByRole('heading', { name: /o que você pode vender/i })).toBeInTheDocument()
    expect(await screen.findByText('Cardápio digital')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Buscar no catálogo'), 'automação')
    expect(await screen.findByText('Automação de rotinas simples')).toBeInTheDocument()
    expect(screen.queryByText('Cardápio digital')).not.toBeInTheDocument()
  })

  it('salva um serviço como oportunidade', async () => {
    const user = userEvent.setup()
    renderAt('/radar/servicos')

    await screen.findByText('Cardápio digital')
    const card = screen.getByText('Cardápio digital').closest('.catalog-card') as HTMLElement
    await user.click(within(card).getByRole('button', { name: 'Salvar' }))

    expect(await within(card).findByRole('button', { name: 'Salvo' })).toBeInTheDocument()
    const saved = await repositories.opportunities.list()
    expect(saved.map((item) => item.serviceKey)).toContain('cardapio-digital')
  })

  it('mostra a análise de adequação sem pontuação de ganho', async () => {
    renderAt('/radar/servicos/site-institucional')

    expect(await screen.findByRole('heading', { name: /esse serviço combina com você/i })).toBeInTheDocument()
    expect(screen.getByText(/não estima demanda nem/i)).toBeInTheDocument()
  })
})

describe('construtor de serviços', () => {
  it('pré-preenche a partir do catálogo e salva o escopo', async () => {
    const user = userEvent.setup()
    renderAt('/servicos/novo?catalogo=cardapio-digital')

    const nameField = (await screen.findByLabelText(/nome do serviço/i)) as HTMLInputElement
    expect(nameField.value).toBe('Cardápio digital')

    await user.click(screen.getByRole('button', { name: 'Salvar serviço' }))

    const blueprints = await repositories.blueprints.list()
    expect(blueprints).toHaveLength(1)
    expect(blueprints[0]?.catalogKey).toBe('cardapio-digital')
    expect(blueprints[0]?.deliverables.length).toBeGreaterThan(1)
  })

  it('não salva sem os campos essenciais', async () => {
    const user = userEvent.setup()
    renderAt('/servicos/novo')

    await user.click(await screen.findByRole('button', { name: 'Salvar serviço' }))
    expect(await screen.findByText(/preencha ao menos nome, problema/i)).toBeInTheDocument()
    expect(await repositories.blueprints.count()).toBe(0)
  })
})

describe('gerador de ofertas', () => {
  it('gera a oferta a partir do serviço estruturado', async () => {
    const blueprint = await seedBlueprint()
    const user = userEvent.setup()
    renderAt(`/ofertas/nova?blueprint=${blueprint.id}`)

    const nameField = (await screen.findByLabelText(/nome da oferta/i)) as HTMLInputElement
    expect(nameField.value).toBe('Site institucional com cardápio')

    await user.click(screen.getByRole('button', { name: 'Salvar oferta' }))

    const offers = await repositories.offers.list()
    expect(offers).toHaveLength(1)
    expect(offers[0]?.blueprintId).toBe(blueprint.id)
    expect(offers[0]?.deliverables).toContain('Cardápio digital')
  })

  it('aponta os pontos que fragilizam a negociação', async () => {
    const blueprint = await seedBlueprint()
    renderAt(`/ofertas/nova?blueprint=${blueprint.id}`)

    expect(await screen.findByText(/pontos que fragilizam a negociação/i)).toBeInTheDocument()
    expect(screen.getByText(/sem preço definido/i)).toBeInTheDocument()
  })
})

describe('prospecção', () => {
  it('monta o rascunho sem inventar informação sobre o negócio', async () => {
    const user = userEvent.setup()
    renderAt('/prospeccao?servico=site-institucional')

    const draft = (await screen.findByLabelText('Mensagem de abordagem')) as HTMLTextAreaElement
    const generated = draft.value
    expect(generated).toContain('site institucional')
    expect(generated).not.toMatch(/não (tem|possui) site/i)
    expect(generated).not.toContain('{')

    await user.click(screen.getByRole('button', { name: 'Direto' }))
    expect((screen.getByLabelText('Mensagem de abordagem') as HTMLTextAreaElement).value).not.toBe(generated)
  })

  it('registra a abordagem criando a negociação no CRM', async () => {
    const user = userEvent.setup()
    renderAt('/prospeccao?servico=cardapio-digital')

    await screen.findByLabelText('Mensagem de abordagem')
    await user.click(screen.getByRole('button', { name: /registrar abordagem no crm/i }))

    expect(await screen.findByText(/negociação criada no crm/i)).toBeInTheDocument()
    const deals = await repositories.deals.list()
    expect(deals).toHaveLength(1)
    expect(deals[0]?.stage).toBe('contatado')
  })

  it('mantém o botão do WhatsApp indisponível sem telefone válido', async () => {
    renderAt('/prospeccao')
    const button = await screen.findByRole('button', { name: /abrir no whatsapp/i })
    expect(button).toBeDisabled()
  })
})

describe('CRM', () => {
  it('cria empresa pelo cadastro manual marcada como manual', async () => {
    const user = userEvent.setup()
    renderAt('/crm?aba=empresas')

    await user.click(await screen.findByRole('button', { name: 'Nova empresa' }))
    await user.type(screen.getByLabelText(/^nome/i), 'Cantina do Bairro')
    await user.type(screen.getByLabelText(/cidade/i), 'Curitiba')
    await user.click(screen.getByRole('button', { name: 'Salvar empresa' }))

    const companies = await repositories.companies.list()
    expect(companies).toHaveLength(1)
    expect(companies[0]?.source).toBe('manual')
    // Sem verificação, a classificação padrão nunca afirma ausência de site.
    expect(companies[0]?.digitalPresence).toBe('site-nao-confirmado')
  })

  it('avança o estágio da negociação', async () => {
    await repositories.deals.create({ title: 'Cantina do Bairro — site', stage: 'novo' })
    const user = userEvent.setup()
    renderAt('/crm')

    await screen.findByText('Cantina do Bairro — site')
    await user.click(screen.getByRole('button', { name: /avançar para contatado/i }))

    const deals = await repositories.deals.list()
    expect(deals[0]?.stage).toBe('contatado')
  })

  it('soma apenas valores informados e avisa quantas estão sem valor', async () => {
    await repositories.deals.create({ title: 'Com valor', stage: 'proposta', potentialValue: 1500 })
    await repositories.deals.create({ title: 'Sem valor', stage: 'novo' })
    renderAt('/crm')

    expect(await screen.findByText(/1 negociação\(ões\) sem valor informado/i)).toBeInTheDocument()
  })
})
