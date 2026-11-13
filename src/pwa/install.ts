import { useSyncExternalStore } from 'react'
import { isIos, isNativeShell, isStandalone } from './environment'

// O evento `beforeinstallprompt` dispara cedo, possivelmente antes de o React
// montar. Por isso é capturado no carregamento do módulo e guardado aqui.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallState =
  /** Casca nativa (Android/Electron) ou já instalado: nada a oferecer. */
  | 'nada'
  /** O navegador oferece um botão de instalar de verdade. */
  | 'disponivel'
  /** iPhone/iPad: só dá pelo menu Compartilhar do Safari. */
  | 'ios'
  /** Navegador sem o evento: instruir a usar o menu do navegador. */
  | 'menu'

let deferred: InstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event as InstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    notify()
  })
}

export function computeState(): InstallState {
  if (installed || isNativeShell() || isStandalone()) return 'nada'
  if (deferred) return 'disponivel'
  if (isIos()) return 'ios'
  return 'menu'
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, computeState, () => 'nada' as InstallState)
}

/** Abre a janela de instalação do navegador. Devolve se o usuário aceitou. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  const event = deferred
  await event.prompt()
  const { outcome } = await event.userChoice
  deferred = null
  notify()
  return outcome === 'accepted'
}
