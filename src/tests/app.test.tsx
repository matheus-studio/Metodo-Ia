import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/app/PreferencesProvider'
import { AppRoutes } from '@/app/router'
import { repositories } from '@/repositories'

function renderApp(route = '/painel') {
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </PreferencesProvider>,
  )
}

describe('aplicação', () => {
  it('abre o painel com o próximo passo e a jornada', async () => {
    renderApp()
    expect(await screen.findByText('Próximo passo recomendado')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /configure seu perfil/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Progresso da jornada')).toBeInTheDocument()
  })

  it('mostra estado vazio no funil quando não há negociações', async () => {
    renderApp()
    expect(await screen.findByText('Nenhuma negociação registrada')).toBeInTheDocument()
  })

  it('reflete registros reais nos indicadores', async () => {
    await repositories.companies.create({
      name: 'Empresa',
      segment: 'Serviços',
      city: 'Curitiba',
      digitalPresence: 'site-nao-confirmado',
      source: 'manual',
    })
    await repositories.deals.create({ title: 'Negociação', stage: 'contatado' })

    renderApp()
    // O funil só aparece depois que o snapshot carrega do banco local.
    expect(await screen.findByText('Contatado')).toBeInTheDocument()

    const empresas = (await screen.findByText('Empresas')).closest('.stat')
    expect(empresas).not.toBeNull()
    expect(await within(empresas as HTMLElement).findByText('1')).toBeInTheDocument()
  })

  it('navega do painel para o roteiro pela navegação principal', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByText('Próximo passo recomendado')

    // No celular o roteiro fica no menu "Mais" — a barra inferior guarda os principais.
    const nav = screen.getByRole('navigation', { name: 'Navegação principal (celular)' })
    await user.click(within(nav).getByRole('button', { name: /mais/i }))
    const sheet = await screen.findByRole('dialog', { name: 'Mais seções' })
    await user.click(within(sheet).getByRole('link', { name: /roteiro/i }))

    expect(await screen.findByRole('heading', { name: /o que já funciona/i })).toBeInTheDocument()
  })

  it('oferece caminho de volta em rota inexistente', async () => {
    renderApp('/rota-que-nao-existe')
    expect(await screen.findByRole('heading', { name: /esta página ainda não existe/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /voltar ao painel/i })).toBeInTheDocument()
  })

  it('mantém o link de pular para o conteúdo em todas as telas', async () => {
    renderApp()
    expect(screen.getByRole('link', { name: /pular para o conteúdo/i })).toBeInTheDocument()
  })
})
