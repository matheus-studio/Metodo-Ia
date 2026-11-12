import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/app/PreferencesProvider'
import { AppRoutes } from '@/app/router'
import { repositories } from '@/repositories'
import { writePreferences } from '@/storage/preferences'
import type { Offer, Project } from '@/types/domain'

function renderAt(route: string) {
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </PreferencesProvider>,
  )
}

async function seedOffer(): Promise<Offer> {
  const blueprint = await repositories.blueprints.create({
    name: 'Site institucional com cardápio',
    problem: 'Só existe em rede social.',
    audience: 'Restaurantes',
    deliverables: ['Página publicada', 'Cardápio digital'],
    tools: ['Construtor de sites'],
    steps: ['Briefing', 'Montagem', 'Publicação'],
    estimatedHours: 12,
    risks: [],
    status: 'pronto',
  })
  return repositories.offers.create({
    name: 'Presença digital — Cantina',
    clientOrSegment: 'Cantina do Bairro',
    blueprintId: blueprint.id,
    deliverables: ['Página publicada', 'Cardápio digital'],
    clientResponsibilities: [],
    differentials: [],
    nextSteps: [],
    currency: 'BRL',
    status: 'aceita',
  })
}

async function seedProject(patch: Partial<Project> = {}): Promise<Project> {
  return repositories.projects.create({
    name: 'Cantina do Bairro — site',
    clientName: 'Cantina do Bairro',
    status: 'briefing',
    briefing: [],
    deliverables: [],
    ...patch,
  })
}

describe('calculadora de preços', () => {
  it('mostra o total e a conta que o produziu', async () => {
    writePreferences({ theme: 'dark', skills: [], onboardingDone: true, hourlyRate: 100 })
    renderAt('/precificacao')

    expect(await screen.findByRole('heading', { name: /quanto cobrar/i })).toBeInTheDocument()
    // 8 h de execução + 2 revisões de 1 h + 2 h de reunião = 12 h × 100, com 20% de margem.
    expect(await screen.findByText('R$ 1.440,00', { selector: '.pricing__total' })).toBeInTheDocument()
    expect(screen.getByText('Reuniões e briefing')).toBeInTheDocument()
  })

  it('transfere o preço calculado para uma oferta existente', async () => {
    writePreferences({ theme: 'dark', skills: [], onboardingDone: true, hourlyRate: 100 })
    const offer = await seedOffer()
    const user = userEvent.setup()
    renderAt('/precificacao')

    await user.selectOptions(await screen.findByLabelText(/transferir para uma oferta/i), offer.id)
    await user.click(screen.getByRole('button', { name: /aplicar preço à oferta/i }))

    expect(await screen.findByText(/preço aplicado à oferta/i)).toBeInTheDocument()
    const updated = await repositories.offers.get(offer.id)
    expect(updated?.price).toBe(1440)
  })
})

describe('projetos', () => {
  it('abre projeto a partir da negociação fechada, com entregáveis e tarefas', async () => {
    const offer = await seedOffer()
    await repositories.deals.create({ title: 'Cantina do Bairro — site', stage: 'fechado', offerId: offer.id })
    const user = userEvent.setup()
    renderAt('/projetos')

    await user.click(await screen.findByRole('button', { name: /cantina do bairro — site/i }))

    const projects = await repositories.projects.list()
    expect(projects).toHaveLength(1)
    // Entregáveis vêm da oferta; tarefas, das etapas do serviço estruturado.
    expect(projects[0]?.deliverables.map((item) => item.title)).toContain('Cardápio digital')
    const tasks = await repositories.tasks.list()
    expect(tasks.map((task) => task.title)).toContain('Montagem')
  })

  it('aplica o modelo de briefing e guarda as respostas', async () => {
    const project = await seedProject()
    const user = userEvent.setup()
    renderAt(`/projetos/${project.id}`)

    await user.selectOptions(await screen.findByLabelText('Modelo'), 'site')
    const question = await screen.findByLabelText(/qual é a ação principal/i)
    await user.type(question, 'Pedir pelo WhatsApp')
    // O campo grava ao perder o foco, não a cada tecla.
    await user.tab()

    const updated = await repositories.projects.get(project.id)
    expect(updated?.briefingTemplate).toBe('site')
    expect(updated?.briefing.some((item) => item.answer.includes('Pedir pelo WhatsApp'))).toBe(true)
  })

  it('impede avançar o estágio enquanto o briefing não existir', async () => {
    const project = await seedProject()
    renderAt(`/projetos/${project.id}`)

    const advance = await screen.findByRole('button', { name: /avançar para planejamento/i })
    expect(advance).toBeDisabled()
    expect(screen.getByText(/escolha um modelo de briefing/i)).toBeInTheDocument()
  })

  it('exige aprovação registrada antes de dar o projeto por entregue', async () => {
    const project = await seedProject({
      status: 'revisao',
      briefing: [{ question: 'A?', answer: 'ok' }],
      deliverables: [{ id: 'd1', title: 'Página publicada', done: true }],
    })
    const user = userEvent.setup()
    renderAt(`/projetos/${project.id}`)

    expect(await screen.findByRole('button', { name: /avançar para entregue/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /registrar aprovação/i }))
    expect(await screen.findByText('Aprovado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /avançar para entregue/i })).toBeEnabled()
  })

  it('marca tarefa como concluída e reflete no progresso', async () => {
    const project = await seedProject({ status: 'execucao' })
    await repositories.tasks.create({ title: 'Montar página', projectId: project.id, done: false })
    await repositories.tasks.create({ title: 'Revisar textos', projectId: project.id, done: false })
    const user = userEvent.setup()
    renderAt(`/projetos/${project.id}`)

    await user.click(await screen.findByRole('checkbox', { name: /marcar "montar página" como concluída/i }))

    const meter = await screen.findByRole('progressbar', { name: /progresso do projeto/i })
    expect(meter).toHaveAttribute('aria-valuenow', '50')
  })
})

describe('painel com projetos', () => {
  it('recomenda avançar o projeto em andamento', async () => {
    writePreferences({ theme: 'dark', skills: ['sites'], onboardingDone: true })
    await seedProject({ status: 'execucao', briefing: [{ question: 'A?', answer: 'ok' }] })
    await repositories.blueprints.create({
      name: 'Serviço',
      problem: 'x',
      audience: 'y',
      deliverables: [],
      tools: [],
      steps: [],
      estimatedHours: 4,
      risks: [],
      status: 'pronto',
    })
    await repositories.offers.create({
      name: 'Oferta',
      clientOrSegment: 'Cliente',
      deliverables: [],
      clientResponsibilities: [],
      differentials: [],
      nextSteps: [],
      currency: 'BRL',
      status: 'aceita',
    })
    await repositories.contacts.create({ name: 'Contato' })
    await repositories.deals.create({ title: 'Negócio', stage: 'fechado' })

    renderAt('/painel')

    const panel = await screen.findByRole('heading', { name: /avance o projeto em andamento/i })
    expect(panel).toBeInTheDocument()
    expect(within(panel.closest('.panel') as HTMLElement).getByRole('link', { name: /abrir projetos/i })).toBeInTheDocument()
  })
})
