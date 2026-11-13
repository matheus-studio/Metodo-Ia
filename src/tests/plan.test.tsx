import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/app/PreferencesProvider'
import { AppRoutes } from '@/app/router'
import { repositories } from '@/repositories'
import { readPlan } from '@/features/plan/planStore'

function renderAt(route: string) {
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </PreferencesProvider>,
  )
}

async function startPlan(user: ReturnType<typeof userEvent.setup>) {
  renderAt('/')
  await user.selectOptions(await screen.findByLabelText(/o que você vai vender/i), 'cardapio-digital')
  await user.type(screen.getByLabelText(/em que cidade/i), 'Curitiba')
  await user.click(screen.getByRole('button', { name: /começar meu plano/i }))
}

describe('plano de 7 dias', () => {
  it('exige serviço e cidade antes de começar', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(await screen.findByRole('button', { name: /começar meu plano/i }))
    expect(await screen.findByText(/escolha um serviço e informe a cidade/i)).toBeInTheDocument()
    expect(readPlan()).toBeNull()
  })

  it('começa o plano, guarda a escolha e manda preparar a mensagem', async () => {
    const user = userEvent.setup()
    await startPlan(user)
    expect(await screen.findByRole('heading', { name: /deixe sua mensagem pronta/i })).toBeInTheDocument()
    expect(screen.getByText('Dia 1 de 7')).toBeInTheDocument()
    expect(readPlan()).toMatchObject({ serviceKey: 'cardapio-digital', city: 'Curitiba', dailyGoal: 5 })
  })

  it('depois de confirmar a mensagem, manda achar os primeiros negócios', async () => {
    const user = userEvent.setup()
    await startPlan(user)
    await user.click(await screen.findByRole('button', { name: /preparar agora/i }))
    await user.click(await screen.findByRole('button', { name: /minha mensagem está pronta/i }))
    expect(await screen.findByRole('heading', { name: /ache seus primeiros negócios/i })).toBeInTheDocument()
  })

  it('salva um negócio na fila, que passa a ser a ação de hoje', async () => {
    const user = userEvent.setup()
    await startPlan(user)
    await user.click(await screen.findByRole('button', { name: /preparar agora/i }))
    await user.click(await screen.findByRole('button', { name: /minha mensagem está pronta/i }))

    const { unmount } = renderAt('/clientes?aba=achar')
    await user.type(await screen.findByLabelText(/nome do negócio/i), 'Padaria Sol')
    await user.click(screen.getByRole('button', { name: /salvar na minha fila/i }))
    expect(await screen.findByText(/padaria sol salvo na sua fila/i)).toBeInTheDocument()

    expect(await repositories.deals.count()).toBe(1)
    expect(readPlan()?.log).toBeDefined()
    unmount()

    renderAt('/')
    expect(await screen.findByRole('heading', { name: /aborde 5 negócios hoje/i })).toBeInTheDocument()
  })

  it('abordar registra a mensagem como enviada e conta no dia', async () => {
    const user = userEvent.setup()
    await startPlan(user)
    await user.click(await screen.findByRole('button', { name: /preparar agora/i }))
    await user.click(await screen.findByRole('button', { name: /minha mensagem está pronta/i }))
    const company = await repositories.companies.create({
      name: 'Padaria Sol',
      segment: 'Alimentação',
      city: 'Curitiba',
      phone: '(41) 99999-0000',
      digitalPresence: 'site-nao-confirmado',
      source: 'manual',
    })
    await repositories.deals.create({ title: 'Cardápio — Padaria Sol', stage: 'novo', companyId: company.id })

    renderAt('/clientes?aba=lista&etapa=novo')
    await user.click(await screen.findByRole('button', { name: /^abordar$/i }))
    expect(await screen.findByRole('link', { name: /abrir no whatsapp/i })).toHaveAttribute(
      'href',
      expect.stringContaining('https://wa.me/5541999990000'),
    )
    await user.click(screen.getByRole('button', { name: /já enviei a mensagem/i }))

    const [deal] = await repositories.deals.list()
    expect(deal?.stage).toBe('contatado')
    expect(deal?.nextActionAt).toBeTruthy()
    const log = Object.values(readPlan()?.log ?? {})
    expect(log.reduce((total, day) => total + day.abordagens, 0)).toBe(1)
    const chip = await screen.findByRole('button', { name: /aguardando/i })
    expect(chip).toHaveTextContent('1')
  })

  it('sem plano, a tela Clientes leva de volta ao começo', async () => {
    renderAt('/clientes')
    expect(await screen.findByText(/comece pelo seu plano/i)).toBeInTheDocument()
  })
})
