import { useState } from 'react'
import { Button, Notice, Panel, SectionHeader } from '@/components/ui'
import { promptInstall, useInstallState } from './install'
import type { InstallState } from './install'

const DISMISS_KEY = 'metodo-ia-pro:install-dismissed'

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function rememberDismissal(): void {
  try {
    localStorage.setItem(DISMISS_KEY, '1')
  } catch {
    // Sem armazenamento: o aviso só volta na próxima visita.
  }
}

function Instructions({ state }: { state: Exclude<InstallState, 'nada'> }) {
  if (state === 'ios') {
    return (
      <p className="secondary">
        No iPhone ou iPad, abra esta página no <strong>Safari</strong>, toque em <strong>Compartilhar</strong> (o quadrado
        com uma seta para cima) e escolha <strong>Adicionar à Tela de Início</strong>.
      </p>
    )
  }
  return (
    <p className="secondary">
      No menu do navegador (os três pontinhos), procure <strong>Instalar aplicativo</strong> ou{' '}
      <strong>Adicionar à tela inicial</strong>.
    </p>
  )
}

/** Cartão fixo em Configurações. Some no app instalado e nas versões Android/Windows/Linux empacotadas. */
export function InstallCard() {
  const state = useInstallState()
  if (state === 'nada') return null

  return (
    <Panel tone="flat">
      <div className="panel-body stack">
        <SectionHeader
          title="Instalar no aparelho"
          description="Abre pelo ícone, em tela cheia, e funciona sem internet depois de instalado."
        />
        {state === 'disponivel' ? (
          <div>
            <Button icon="check" onClick={() => void promptInstall()}>
              Instalar aplicativo
            </Button>
          </div>
        ) : (
          <Instructions state={state} />
        )}
      </div>
    </Panel>
  )
}

/** Aviso discreto e dispensável no painel; só quando há um jeito claro de instalar. */
export function InstallBanner() {
  const state = useInstallState()
  const [hidden, setHidden] = useState(wasDismissed)
  if (hidden || (state !== 'disponivel' && state !== 'ios')) return null

  const dismiss = () => {
    rememberDismissal()
    setHidden(true)
  }

  return (
    <Notice tone="info">
      <strong>Instale o aplicativo.</strong> Abre pelo ícone, em tela cheia, e funciona sem internet.
      {state === 'ios' ? <Instructions state="ios" /> : null}
      <div className="install-actions">
        {state === 'disponivel' && (
          <Button size="sm" onClick={() => void promptInstall()}>
            Instalar
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Agora não
        </Button>
      </div>
    </Notice>
  )
}
