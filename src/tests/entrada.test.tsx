import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/app/PreferencesProvider'
import { AppRoutes } from '@/app/router'
import { CONTENT_COUNTS } from '@/app/contentCounts'

function renderAt(route: string) {
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </PreferencesProvider>,
  )
}

/**
 * O produto não tem página de apresentação: quem abre o endereço cai dentro do
 * aplicativo. Estes testes existem para que uma landing não volte sem decisão.
 */
describe('entrada do aplicativo', () => {
  it('abre o aplicativo na raiz, com a navegação do shell', async () => {
    const { container } = renderAt('/')
    expect(await screen.findByText('Do zero ao primeiro cliente, um passo por dia')).toBeInTheDocument()
    expect(container.querySelector('.bottomnav')).not.toBeNull()
    expect(container.querySelector('.rail')).not.toBeNull()
  })

  it('não tem porta de entrada comercial antes do aplicativo', async () => {
    const { container } = renderAt('/')
    await screen.findByText('Do zero ao primeiro cliente, um passo por dia')
    const texto = container.textContent ?? ''

    expect(screen.queryByRole('link', { name: /abrir o aplicativo|começar agora/i })).toBeNull()
    expect(texto).not.toMatch(/R\$\s?\d/)
    expect(texto).not.toMatch(/assinar|comprar|checkout|depoimento/i)
  })

  it('mantém funcionando o endereço antigo do painel', async () => {
    renderAt('/painel')
    expect(await screen.findByText('Próximo passo recomendado')).toBeInTheDocument()
  })

  it('no primeiro acesso diz o que já existe dentro do aplicativo', async () => {
    renderAt('/')
    const intro = await screen.findByText(/escolha entre/i)
    expect(intro).toHaveTextContent(String(CONTENT_COUNTS.servicos))
    // Sem conta e sem nuvem é a promessa que a tela precisa sustentar.
    expect(intro).toHaveTextContent(/fica neste aparelho/i)
  })

  it('mostra a marca uma única vez para o leitor de tela', async () => {
    renderAt('/')
    await screen.findByText('Do zero ao primeiro cliente, um passo por dia')
    // A marca do trilho acompanha o nome escrito: o desenho não repete o nome.
    expect(screen.getAllByRole('img', { name: 'Método IA Pro' })).toHaveLength(1)
  })
})
