import { describe, expect, it } from 'vitest'
import { displayUrl, safeExternalUrl, safeTelHref } from './url'

describe('safeExternalUrl', () => {
  it('aceita http e https', () => {
    expect(safeExternalUrl('https://exemplo.com.br')).toBe('https://exemplo.com.br/')
    expect(safeExternalUrl('http://exemplo.com.br/menu')).toBe('http://exemplo.com.br/menu')
  })

  it('completa endereço digitado sem esquema', () => {
    expect(safeExternalUrl('exemplo.com.br')).toBe('https://exemplo.com.br/')
  })

  // Este é o ponto da função: href com javascript: executa no clique.
  it('recusa javascript:, data: e outros esquemas executáveis', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(safeExternalUrl('JavaScript:alert(1)')).toBeNull()
    expect(safeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeExternalUrl('vbscript:msgbox(1)')).toBeNull()
    expect(safeExternalUrl('file:///etc/passwd')).toBeNull()
  })

  it('recusa vazio, espaço em branco e texto absurdamente longo', () => {
    expect(safeExternalUrl('')).toBeNull()
    expect(safeExternalUrl('   ')).toBeNull()
    expect(safeExternalUrl(undefined)).toBeNull()
    expect(safeExternalUrl(`https://exemplo.com/${'a'.repeat(3000)}`)).toBeNull()
  })

  it('recusa endereço sem host', () => {
    expect(safeExternalUrl('https://')).toBeNull()
  })
})

describe('displayUrl', () => {
  it('mostra domínio sem www e sem barra final', () => {
    expect(displayUrl('https://www.exemplo.com.br/')).toBe('exemplo.com.br')
    expect(displayUrl('https://exemplo.com.br/cardapio')).toBe('exemplo.com.br/cardapio')
  })

  it('devolve nulo para endereço inseguro', () => {
    expect(displayUrl('javascript:alert(1)')).toBeNull()
  })
})

describe('safeTelHref', () => {
  it('mantém apenas dígitos e o sinal de mais', () => {
    expect(safeTelHref('(41) 99999-0000')).toBe('tel:41999990000')
    expect(safeTelHref('+55 41 99999-0000')).toBe('tel:+5541999990000')
  })

  it('recusa número implausível ou com tentativa de injeção', () => {
    expect(safeTelHref('123')).toBeNull()
    expect(safeTelHref('javascript:alert(1)')).toBeNull()
    expect(safeTelHref(undefined)).toBeNull()
  })
})
