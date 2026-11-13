/**
 * Pré-carregamento de rota por intenção.
 *
 * Cada rota é um chunk separado, o que mantém o primeiro carregamento pequeno —
 * mas significa uma ida à rede no primeiro clique de cada seção. Baixar o chunk
 * quando o ponteiro entra no link (ou quando ele recebe foco pelo teclado)
 * elimina essa espera sem aumentar o carregamento inicial.
 *
 * Os especificadores são idênticos aos de `router.tsx` de propósito: assim o
 * bundler reaproveita o mesmo chunk, em vez de gerar um segundo.
 */

const LOADERS: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/features/plan/TodayPage'),
  '/clientes': () => import('@/features/clients/ClientsPage'),
  '/painel': () => import('@/features/dashboard/DashboardPage'),
  '/roteiro': () => import('@/features/roadmap/RoadmapPage'),
  '/configuracoes': () => import('@/features/settings/SettingsPage'),
  '/radar/servicos': () => import('@/features/catalog/CatalogPage'),
  '/servicos': () => import('@/features/service-builder/ServicesPage'),
  '/ofertas': () => import('@/features/offers/OffersPage'),
  '/prospeccao': () => import('@/features/prospecting/ProspectingPage'),
  '/crm': () => import('@/features/crm/CrmPage'),
  '/projetos': () => import('@/features/projects/ProjectsPage'),
  '/precificacao': () => import('@/features/pricing/PricingPage'),
  '/studio': () => import('@/features/studio/StudioPage'),
  '/biblioteca': () => import('@/features/library/LibraryPage'),
  '/academia': () => import('@/features/academy/AcademyPage'),
}

const alreadyRequested = new Set<string>()

/**
 * Sair do tratador do evento antes de importar.
 *
 * Medição em Chromium: disparar o `import()` dentro do próprio `pointerenter`
 * fazia daquele evento a interação mais lenta do aplicativo (88 ms), porque a
 * resolução do módulo entrava antes da próxima pintura. Adiando para o tempo
 * ocioso, o ponteiro volta a responder no quadro seguinte e o download começa
 * igual — alguns milissegundos depois, o que não muda nada para quem navega.
 */
const soon: (run: () => void) => void =
  typeof requestIdleCallback === 'function'
    ? (run) => void requestIdleCallback(run, { timeout: 300 })
    : (run) => void setTimeout(run, 0)

export function prefetchRoute(path: string): void {
  const loader = LOADERS[path]
  if (!loader || alreadyRequested.has(path)) return
  alreadyRequested.add(path)
  // Falha de rede aqui é irrelevante: a navegação real tenta de novo.
  soon(() => void loader().catch(() => alreadyRequested.delete(path)))
}

/** Props prontas para aplicar a um link de navegação. */
export function prefetchHandlers(path: string) {
  return {
    onPointerEnter: () => prefetchRoute(path),
    onFocus: () => prefetchRoute(path),
  }
}
