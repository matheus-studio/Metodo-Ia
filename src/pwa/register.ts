import { isNativeShell, isStandalone } from './environment'

/**
 * Registra o service worker que guarda o aplicativo no aparelho (uso offline).
 * Só em produção, só em http(s) e nunca dentro do Android/Electron, onde os
 * arquivos já estão no próprio pacote.
 */
export function registerOfflineSupport(): void {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return
  if (!/^https?:$/.test(location.protocol)) return
  if (isNativeShell()) return

  window.addEventListener('load', () => {
    // Caminho relativo à página: funciona na raiz do domínio e em subpastas.
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Sem service worker o app continua funcionando online; não incomoda o usuário.
    })
  })
}

/**
 * Pede ao navegador que não apague os dados do app quando faltar espaço.
 * Só quando já instalado: no navegador comum, o Firefox abriria um pedido de
 * permissão fora de contexto, e o Chrome concede por conta própria ao instalar.
 */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (isNativeShell() || !isStandalone()) return
    await navigator.storage?.persist?.()
  } catch {
    // Melhor esforço.
  }
}
