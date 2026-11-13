import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// O módulo guarda estado global (evento capturado); cada teste recarrega um limpo.
async function load() {
  vi.resetModules()
  return import('./install')
}

const overridden = new Set<string>()

// O jsdom não define todas as propriedades de `navigator`; por isso
// defineProperty em vez de spyOn.
function setNavigator(values: Record<string, unknown>) {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(navigator, key, { value, configurable: true })
    overridden.add(key)
  }
}

function setUserAgent(ua: string, platform = 'Linux x86_64', touch = 0) {
  setNavigator({ userAgent: ua, platform, maxTouchPoints: touch })
}

function standalone(on: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: on }) as unknown as typeof window.matchMedia
}

describe('estado de instalação do PWA', () => {
  beforeEach(() => {
    standalone(false)
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64) Chrome/130')
  })
  afterEach(() => {
    vi.restoreAllMocks()
    for (const key of overridden) delete (navigator as unknown as Record<string, unknown>)[key]
    overridden.clear()
  })

  it('sem evento do navegador, orienta pelo menu', async () => {
    const { computeState } = await load()
    expect(computeState()).toBe('menu')
  })

  it('no iPhone, orienta pelo botão Compartilhar do Safari', async () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/605', 'iPhone', 5)
    const { computeState } = await load()
    expect(computeState()).toBe('ios')
  })

  it('no iPad que se apresenta como Mac, também reconhece iOS', async () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605', 'MacIntel', 5)
    const { computeState } = await load()
    expect(computeState()).toBe('ios')
  })

  it('quando o navegador oferece instalar, fica disponível e o prompt é aberto', async () => {
    const { computeState, promptInstall } = await load()
    const prompt = vi.fn().mockResolvedValue(undefined)
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(computeState()).toBe('disponivel')
    await expect(promptInstall()).resolves.toBe(true)
    expect(prompt).toHaveBeenCalledOnce()
    // O evento só pode ser usado uma vez.
    expect(computeState()).toBe('menu')
  })

  it('já instalado (modo standalone): nada a oferecer', async () => {
    standalone(true)
    const { computeState } = await load()
    expect(computeState()).toBe('nada')
  })

  it('dentro do Electron (app://) ou do Android (Capacitor): nada a oferecer', async () => {
    ;(window as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true }
    const { computeState } = await load()
    expect(computeState()).toBe('nada')
    delete (window as unknown as { Capacitor?: unknown }).Capacitor
  })
})
