// Em que "casca" o aplicativo está rodando. O mesmo build serve ao navegador
// (PWA), ao Electron (protocolo app://) e ao Android (Capacitor); só o primeiro
// usa service worker e oferece "instalar".

type CapacitorGlobal = { isNativePlatform?: () => boolean }

/** Android empacotado (Capacitor) ou desktop empacotado (Electron). */
export function isNativeShell(): boolean {
  const capacitor = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor
  if (capacitor?.isNativePlatform?.()) return true
  return location.protocol === 'app:'
}

/** Já aberto como aplicativo instalado (sem barra do navegador). */
export function isStandalone(): boolean {
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true
}

export function isIos(): boolean {
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return true
  // iPadOS 13+ se apresenta como Mac, mas tem tela de toque.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}
