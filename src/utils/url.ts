/**
 * Saneamento de URL e telefone para links renderizados.
 *
 * Um endereço digitado pelo usuário (ou vindo de um backup importado, ou de um
 * provedor externo no futuro) é entrada não confiável. Colocá-lo direto em um
 * href permite `javascript:` e `data:`, que executam no clique — um XSS que
 * não depende de HTML injetado. Todo link externo do produto passa por aqui.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

/**
 * Devolve a URL apenas se for http/https. Endereço sem esquema recebe
 * `https://`, que é o que o usuário quis dizer ao digitar "site.com.br".
 */
export function safeExternalUrl(raw: string | undefined | null): string | null {
  if (!raw) return null
  const value = raw.trim()
  if (value === '' || value.length > 2000) return null

  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) ? value : `https://${value}`

  try {
    const url = new URL(candidate)
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null
    if (url.hostname === '') return null
    return url.toString()
  } catch {
    return null
  }
}

/** Rótulo curto e legível para mostrar no lugar da URL inteira. */
export function displayUrl(raw: string | undefined | null): string | null {
  const safe = safeExternalUrl(raw)
  if (!safe) return null
  try {
    const url = new URL(safe)
    return `${url.hostname}${url.pathname === '/' ? '' : url.pathname}`.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Telefone para link `tel:`: só dígitos e os sinais aceitos no padrão. */
export function safeTelHref(raw: string | undefined | null): string | null {
  if (!raw) return null
  const cleaned = raw.replace(/[^\d+]/g, '')
  const digits = cleaned.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) return null
  return `tel:${cleaned}`
}
