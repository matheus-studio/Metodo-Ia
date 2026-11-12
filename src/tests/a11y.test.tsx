import axe from 'axe-core'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/app/PreferencesProvider'
import { AppRoutes } from '@/app/router'
import { repositories } from '@/repositories'

/**
 * Auditoria automatizada com axe-core (referência WCAG 2.2 AA).
 *
 * Limite conhecido: no jsdom não há layout nem pintura, então as regras de
 * contraste e de alvo de toque não rodam aqui. Elas são verificadas por
 * `npm run contrast`, que calcula a razão de contraste dos tokens, e o alvo de
 * toque está garantido por CSS (min-height de 44 px em campos e 48 px na
 * navegação). Teste de leitor de tela real continua pendente — está declarado
 * em docs/qualidade.md.
 */

const RULES_OFF = new Set(['color-contrast', 'target-size'])

async function auditRoute(route: string): Promise<axe.Result[]> {
  const { container } = render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </PreferencesProvider>,
  )
  // Espera o carregamento assíncrono das rotas (lazy) e dos dados locais.
  await new Promise((resolve) => setTimeout(resolve, 150))

  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
  })
  return results.violations.filter((violation) => !RULES_OFF.has(violation.id))
}

function describeViolations(route: string, violations: axe.Result[]): string {
  return `${route}: ${violations.map((v) => `${v.id} (${v.nodes.length}x) — ${v.help}`).join(' | ')}`
}

const ROUTES = [
  '/',
  '/painel',
  '/radar/servicos',
  '/radar/servicos/site-institucional',
  '/servicos',
  '/servicos/novo',
  '/ofertas',
  '/ofertas/nova',
  '/prospeccao',
  '/crm',
  '/crm?aba=contatos',
  '/crm?aba=empresas',
  '/projetos',
  '/precificacao',
  '/studio',
  '/biblioteca',
  '/biblioteca?material=checklist-publicacao-site',
  '/academia',
  '/academia?aula=o-que-e-crm',
  '/missoes',
  '/roteiro',
  '/configuracoes',
]

describe('acessibilidade (axe-core)', () => {
  for (const route of ROUTES) {
    it(`sem violações em ${route}`, async () => {
      const violations = await auditRoute(route)
      expect(describeViolations(route, violations)).toBe(`${route}: `)
    }, 20_000)
  }

  it('sem violações com dados reais carregados', async () => {
    await repositories.companies.create({
      name: 'Cantina do Bairro',
      segment: 'Alimentação',
      city: 'Curitiba',
      phone: '(41) 99999-0000',
      website: 'https://exemplo.com.br',
      digitalPresence: 'site-identificado',
      source: 'manual',
    })
    await repositories.deals.create({ title: 'Cantina — site', stage: 'proposta', potentialValue: 1500 })
    const violations = await auditRoute('/crm')
    expect(describeViolations('/crm com dados', violations)).toBe('/crm com dados: ')
  }, 20_000)
})
