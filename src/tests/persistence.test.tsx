import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/app/PreferencesProvider'
import { AppRoutes } from '@/app/router'
import { repositories } from '@/repositories'
import { resetStorageHealth, setStorageHealth } from '@/storage/storageHealth'

/**
 * O usuário precisa saber quando os dados não estão sendo gravados no aparelho.
 * Mostrar "salvo" com os registros apenas em memória é o pior desfecho possível:
 * ele trabalha a manhã inteira e perde tudo ao fechar a aba.
 */

function renderAt(route: string) {
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </PreferencesProvider>,
  )
}

beforeEach(() => resetStorageHealth())
afterEach(() => resetStorageHealth())

describe('aviso de armazenamento', () => {
  it('não aparece quando o IndexedDB está funcionando', async () => {
    setStorageHealth('persistente')
    renderAt('/painel')
    await screen.findByText('Próximo passo recomendado')
    expect(screen.queryByText(/existe apenas nesta aba/i)).toBeNull()
  })

  it('avisa quando os dados ficam só na memória', async () => {
    setStorageHealth('memoria', 'IndexedDB indisponível.')
    renderAt('/painel')
    expect(await screen.findByText(/existe apenas nesta aba e some ao fechá-la/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /exportar backup/i })).toBeInTheDocument()
  })

  it('avisa quando o armazenamento está cheio', async () => {
    setStorageHealth('sem-espaco')
    renderAt('/crm')
    expect(await screen.findByText(/armazenamento do navegador está cheio/i)).toBeInTheDocument()
  })

  it('configurações mostram o estado atual do armazenamento', async () => {
    setStorageHealth('persistente')
    renderAt('/configuracoes')
    expect(await screen.findByRole('heading', { name: /onde seus dados estão/i })).toBeInTheDocument()
    expect(screen.getByText('Gravando no aparelho')).toBeInTheDocument()
  })

  it('configurações sinalizam gravação volátil em vez de dizer "salvo"', async () => {
    setStorageHealth('memoria')
    renderAt('/configuracoes')
    expect(await screen.findByText('Apenas nesta aba')).toBeInTheDocument()
  })
})

describe('ciclo de vida dos dados', () => {
  it('registro criado é lido de volta depois de reabrir a conexão', async () => {
    const criado = await repositories.contacts.create({ name: 'Cliente persistente', phone: '41999990000' })

    // Simula o fechamento e a reabertura do aplicativo: nova leitura do banco.
    const { resetConnection } = await import('@/storage/indexedDb')
    resetConnection()

    const lido = await repositories.contacts.get(criado.id)
    expect(lido?.name).toBe('Cliente persistente')
  })

  it('edição e exclusão sobrevivem à releitura', async () => {
    const criado = await repositories.tasks.create({ title: 'Original', done: false })
    await repositories.tasks.update(criado.id, { title: 'Editada', done: true })

    const { resetConnection } = await import('@/storage/indexedDb')
    resetConnection()
    expect((await repositories.tasks.get(criado.id))?.title).toBe('Editada')

    await repositories.tasks.remove(criado.id)
    resetConnection()
    expect(await repositories.tasks.get(criado.id)).toBeUndefined()
  })
})
