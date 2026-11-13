import { lazy, Suspense } from 'react'
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { PageSkeleton } from '@/components/PageSkeleton'
import { NotFoundPage } from '@/components/NotFoundPage'
import type { ComponentType } from 'react'

// Cada rota é um chunk próprio: o primeiro carregamento traz apenas o painel.
const TodayPage = lazy(() => import('@/features/plan/TodayPage'))
const ClientsPage = lazy(() => import('@/features/clients/ClientsPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const RoadmapPage = lazy(() => import('@/features/roadmap/RoadmapPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
const CatalogPage = lazy(() => import('@/features/catalog/CatalogPage'))
const ServiceDetailPage = lazy(() => import('@/features/catalog/ServiceDetailPage'))
const ServicesPage = lazy(() => import('@/features/service-builder/ServicesPage'))
const BlueprintEditorPage = lazy(() => import('@/features/service-builder/BlueprintEditorPage'))
const OffersPage = lazy(() => import('@/features/offers/OffersPage'))
const OfferEditorPage = lazy(() => import('@/features/offers/OfferEditorPage'))
const ProspectingPage = lazy(() => import('@/features/prospecting/ProspectingPage'))
const CrmPage = lazy(() => import('@/features/crm/CrmPage'))
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage'))
const ProjectEditorPage = lazy(() => import('@/features/projects/ProjectEditorPage'))
const PricingPage = lazy(() => import('@/features/pricing/PricingPage'))
const StudioPage = lazy(() => import('@/features/studio/StudioPage'))
const LibraryPage = lazy(() => import('@/features/library/LibraryPage'))
const AcademyPage = lazy(() => import('@/features/academy/AcademyPage'))
const MissionsPage = lazy(() => import('@/features/missions/MissionsPage'))

function lazyRoute(Component: ComponentType) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Component />
    </Suspense>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* A raiz é o aplicativo: não há página de apresentação na frente. */}
        <Route path="/" element={lazyRoute(TodayPage)} />
        <Route path="/clientes" element={lazyRoute(ClientsPage)} />
        <Route path="/painel" element={lazyRoute(DashboardPage)} />
        <Route path="/roteiro" element={lazyRoute(RoadmapPage)} />
        <Route path="/configuracoes" element={lazyRoute(SettingsPage)} />

        <Route path="/radar" element={<Navigate to="/radar/servicos" replace />} />
        <Route path="/radar/servicos" element={lazyRoute(CatalogPage)} />
        <Route path="/radar/servicos/:key" element={lazyRoute(ServiceDetailPage)} />

        <Route path="/servicos" element={lazyRoute(ServicesPage)} />
        <Route path="/servicos/novo" element={lazyRoute(BlueprintEditorPage)} />
        <Route path="/servicos/:id" element={lazyRoute(BlueprintEditorPage)} />

        <Route path="/ofertas" element={lazyRoute(OffersPage)} />
        <Route path="/ofertas/nova" element={lazyRoute(OfferEditorPage)} />
        <Route path="/ofertas/:id" element={lazyRoute(OfferEditorPage)} />

        <Route path="/prospeccao" element={lazyRoute(ProspectingPage)} />
        <Route path="/crm" element={lazyRoute(CrmPage)} />

        <Route path="/projetos" element={lazyRoute(ProjectsPage)} />
        <Route path="/projetos/:id" element={lazyRoute(ProjectEditorPage)} />
        <Route path="/precificacao" element={lazyRoute(PricingPage)} />

        <Route path="/studio" element={lazyRoute(StudioPage)} />
        <Route path="/biblioteca" element={lazyRoute(LibraryPage)} />
        <Route path="/academia" element={lazyRoute(AcademyPage)} />
        <Route path="/missoes" element={lazyRoute(MissionsPage)} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

/**
 * Hospedagem estática sem regra de reescrita (e WebView do Capacitor) não
 * resolve rota profunda por caminho. Nesses alvos o build roda com
 * `VITE_ROUTER=hash` e as rotas passam a viver no fragmento da URL.
 */
export function AppRouter() {
  const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}
