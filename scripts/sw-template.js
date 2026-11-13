/* Service worker do Método IA Pro — gerado no build (scripts/offlinePlugin.ts).
 *
 * Estratégia: o aplicativo inteiro é guardado no aparelho na instalação e
 * servido de lá (cache primeiro). Isso garante duas coisas:
 *  - abre rápido e funciona sem internet;
 *  - a página e os arquivos que ela pede são sempre da MESMA versão.
 *
 * Atualização: cada build tem uma VERSION nova. O navegador baixa o novo worker
 * em segundo plano e ele espera as janelas abertas fecharem (sem skipWaiting,
 * de propósito: trocar de versão com a tela aberta quebraria os blocos que o app
 * carrega sob demanda). Na próxima abertura do app, já é a versão nova.
 *
 * Dados do usuário (IndexedDB) não passam por aqui e nunca são tocados.
 */
const VERSION = '__VERSION__'
const CACHE_PREFIX = 'metodo-ia-pro-app-'
const CACHE = CACHE_PREFIX + VERSION
const FILES = __FILES__

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // cache: 'reload' ignora o cache HTTP do navegador, para não guardar
      // arquivos velhos de uma versão anterior.
      .then((cache) => cache.addAll(FILES.map((file) => new Request(new URL(file, self.registration.scope), { cache: 'reload' })))),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Abrir o app (qualquer endereço dentro do escopo) = a página guardada.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches
        .open(CACHE)
        .then((cache) => cache.match(new URL('index.html', self.registration.scope)))
        .then((cached) => cached || fetch(request)),
    )
    return
  }

  event.respondWith(
    caches
      .open(CACHE)
      .then((cache) => cache.match(request, { ignoreSearch: true }))
      .then((cached) => cached || fetch(request)),
  )
})
