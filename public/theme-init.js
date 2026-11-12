/**
 * Define o tema antes do primeiro paint, evitando flash de tema incorreto.
 *
 * Fica em arquivo externo de propósito: como script inline, exigiria
 * 'unsafe-inline' em script-src (ou um hash recalculado a cada alteração),
 * e enfraquecer a CSP por um detalhe visual é um péssimo negócio.
 * O arquivo tem poucas centenas de bytes e é cacheado pelo navegador.
 */
;(function () {
  try {
    var saved = JSON.parse(localStorage.getItem('metodo-ia-pro:preferences') || '{}')
    var theme = saved.theme === 'light' || saved.theme === 'dark' ? saved.theme : null
    if (!theme || saved.theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    }
    document.documentElement.dataset.theme = theme
  } catch {
    document.documentElement.dataset.theme = 'dark'
  }
})()
