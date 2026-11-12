import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/app/PreferencesProvider'
import { AppRoutes } from '@/app/router'
import { repositories } from '@/repositories'
import { readPreferences } from '@/storage/preferences'

function renderSettings() {
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={['/configuracoes']}>
        <AppRoutes />
      </MemoryRouter>
    </PreferencesProvider>,
  )
}

describe('configurações', () => {
  it('salva o perfil informado e conclui o onboarding ao adicionar habilidade', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.type(await screen.findByPlaceholderText('Seu nome ou apelido'), 'Matheus')
    await user.type(screen.getByLabelText('Adicionar habilidade'), 'criação de sites')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(screen.getByRole('button', { name: /remover habilidade criação de sites/i })).toBeInTheDocument()
    const saved = readPreferences()
    expect(saved.displayName).toBe('Matheus')
    expect(saved.skills).toContain('criação de sites')
    expect(saved.onboardingDone).toBe(true)
  })

  it('troca o tema e aplica no documento', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(await screen.findByRole('button', { name: 'Claro' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(readPreferences().theme).toBe('light')
  })

  it('carrega e remove os dados de demonstração', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(await screen.findByRole('button', { name: /carregar demonstração/i }))
    expect(await screen.findByText(/demonstração carregados/i)).toBeInTheDocument()
    expect(await repositories.companies.count()).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /remover demonstração/i }))
    expect(await screen.findByText(/registro\(s\) de demonstração removido/i)).toBeInTheDocument()
    expect(await repositories.companies.count()).toBe(0)
  })

  it('exige confirmação antes de apagar todos os dados', async () => {
    const user = userEvent.setup()
    await repositories.contacts.create({ name: 'Contato importante' })
    renderSettings()

    await user.click(await screen.findByRole('button', { name: 'Apagar todos os dados' }))
    // Primeiro clique apenas abre a confirmação — nada foi removido ainda.
    expect(await repositories.contacts.count()).toBe(1)

    await user.click(screen.getByRole('button', { name: /sim, apagar tudo/i }))
    expect(await screen.findByText(/registros locais foram apagados/i)).toBeInTheDocument()
    expect(await repositories.contacts.count()).toBe(0)
  })

  it('permite cancelar a exclusão sem perder dados', async () => {
    const user = userEvent.setup()
    await repositories.contacts.create({ name: 'Contato importante' })
    renderSettings()

    await user.click(await screen.findByRole('button', { name: 'Apagar todos os dados' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(await repositories.contacts.count()).toBe(1)
  })
})
