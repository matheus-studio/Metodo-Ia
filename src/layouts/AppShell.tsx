import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Logo, LogoMark } from '@/brand/Logo'
import { availableByGroup, GROUP_LABELS, MODULES, PRIMARY_MODULES, SECONDARY_MODULES } from '@/app/modules'
import { usePreferences } from '@/app/preferencesContext'
import { APP_VERSION } from '@/app/version'
import { Icon } from '@/components/ui'
import { STORAGE_MESSAGES, useStorageHealth } from '@/hooks/useStorageHealth'
import { prefetchHandlers } from '@/app/routePrefetch'

function ThemeToggle() {
  const { preferences, resolvedTheme, update } = usePreferences()
  const next = resolvedTheme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      className="icon-button"
      onClick={() => update({ theme: next })}
      aria-label={`Mudar para tema ${next === 'dark' ? 'escuro' : 'claro'}`}
      title={`Tema ${preferences.theme === 'system' ? 'do sistema' : preferences.theme === 'dark' ? 'escuro' : 'claro'}`}
    >
      <Icon name={resolvedTheme === 'dark' ? 'moon' : 'sun'} size={18} />
    </button>
  )
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'rail__link is-active' : 'rail__link'
}

/** Faixa de aviso quando os dados não estão sendo gravados no aparelho. */
function StorageBanner() {
  const storage = useStorageHealth()
  const message = STORAGE_MESSAGES[storage.mode]
  if (!message) return null
  return (
    <div className="storage-banner" role="status">
      <Icon name="alert" size={16} />
      <p>{message}</p>
      <NavLink to="/configuracoes" className="storage-banner__link">
        Exportar backup
      </NavLink>
    </div>
  )
}

export function AppShell() {
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const groups = availableByGroup()
  const current = [...MODULES]
    .sort((a, b) => b.path.length - a.path.length)
    // A raiz é o painel: casa exato, senão todo caminho começaria por ela.
    .find((module) =>
      module.path === '/' ? location.pathname === '/' : location.pathname.startsWith(module.path),
    )

  // Navegar fecha o menu "Mais" — menu aberto sobre a tela nova confunde.
  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  return (
    <div className="shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>

      <aside className="rail" aria-label="Navegação principal">
        <div className="rail__brand">
          <Logo size={32} />
          <p className="rail__tagline">Da oportunidade à execução</p>
        </div>

        <nav className="rail__nav">
          {groups.map(({ group, modules }) => (
            <div key={group}>
              <p className="eyebrow rail__group-label">{GROUP_LABELS[group]}</p>
              <ul>
                {modules.map((module) => (
                  <li key={module.key}>
                    <NavLink
                      to={module.path}
                      className={navClass}
                      end={module.path === '/servicos' || module.path === '/'}
                      {...prefetchHandlers(module.path)}
                    >
                      <Icon name={module.icon} size={18} />
                      <span>{module.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </nav>

        <div className="rail__footer">
          <ThemeToggle />
          <span className="muted rail__version">Versão {APP_VERSION}</span>
        </div>
      </aside>

      <div className="shell__main">
        <header className="topbar">
          <span className="topbar__brand">
            <LogoMark size={28} />
          </span>
          <h1 className="topbar__title">{current?.label ?? 'Método IA Pro'}</h1>
          <div className="topbar__actions">
            <ThemeToggle />
          </div>
        </header>

        <StorageBanner />

        <main id="conteudo" className="content" tabIndex={-1}>
          {/* A chave remonta o conteúdo a cada rota e dispara a animação de entrada. */}
          <div className="route-enter" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>

      {moreOpen && (
        <>
          <button className="more-sheet__backdrop" aria-label="Fechar menu" onClick={() => setMoreOpen(false)} />
          <div className="more-sheet" role="dialog" aria-label="Mais seções">
            <p className="eyebrow">Mais</p>
            <ul>
              {SECONDARY_MODULES.map((module) => (
                <li key={module.key}>
                  <NavLink
                    to={module.path}
                    className="more-sheet__link"
                    end={module.path === '/servicos' || module.path === '/'}
                    {...prefetchHandlers(module.path)}
                  >
                    <Icon name={module.icon} size={18} />
                    <span>
                      <span className="more-sheet__label">{module.label}</span>
                      <span className="more-sheet__summary">{module.summary}</span>
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <nav className="bottomnav" aria-label="Navegação principal (celular)">
        {PRIMARY_MODULES.map((module) => (
          <NavLink
            key={module.key}
            to={module.path}
            end={module.path === '/servicos' || module.path === '/'}
            className={({ isActive }) => (isActive ? 'bottomnav__link is-active' : 'bottomnav__link')}
            {...prefetchHandlers(module.path)}
          >
            <Icon name={module.icon} size={20} />
            <span>{module.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={moreOpen ? 'bottomnav__link is-active' : 'bottomnav__link'}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((value) => !value)}
        >
          <Icon name={moreOpen ? 'close' : 'menu'} size={20} />
          <span>Mais</span>
        </button>
      </nav>
    </div>
  )
}
