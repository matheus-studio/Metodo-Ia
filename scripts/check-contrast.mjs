#!/usr/bin/env node
/**
 * Verificação de contraste dos tokens (WCAG 2.2, critério 1.4.3 / 1.4.11).
 *
 * Existe porque o axe-core rodando em jsdom não avalia contraste: sem layout e
 * sem pintura, ele pula a regra. Aqui a razão é calculada a partir dos valores
 * declarados em src/design/tokens.css, nos dois temas, e o script falha se
 * algum par ficar abaixo do mínimo. Rode com `npm run contrast`.
 */

import { readFileSync } from 'node:fs'

const CSS = readFileSync(new URL('../src/design/tokens.css', import.meta.url), 'utf8')

/* --------------------------------------------------- leitura dos tokens */

function extractBlock(selector) {
  const index = CSS.indexOf(selector)
  if (index === -1) throw new Error(`Bloco não encontrado: ${selector}`)
  const start = CSS.indexOf('{', index)
  const end = CSS.indexOf('\n}', start)
  return CSS.slice(start, end)
}

function parseTokens(block) {
  const tokens = {}
  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim()
  }
  return tokens
}

const darkTokens = parseTokens(extractBlock(':root {'))
const lightTokens = { ...darkTokens, ...parseTokens(extractBlock(":root[data-theme='light']")) }

/* ------------------------------------------------------------ cor → rgb */

function resolve(tokens, value, depth = 0) {
  if (depth > 10) throw new Error(`Referência circular em ${value}`)
  const variable = value.match(/^var\((--[\w-]+)\)$/)
  if (variable) return resolve(tokens, tokens[variable[1]], depth + 1)
  return value
}

function toRgba(raw) {
  const value = raw.trim()
  const hex = value.match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    const int = Number.parseInt(hex[1], 16)
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255, 1]
  }
  const rgba = value.match(/^rgba?\(([^)]+)\)$/i)
  if (rgba) {
    const parts = rgba[1].split(',').map((part) => Number.parseFloat(part.trim()))
    return [parts[0], parts[1], parts[2], parts[3] === undefined ? 1 : parts[3]]
  }
  throw new Error(`Cor não reconhecida: ${value}`)
}

/** Achata a cor com alpha sobre o fundo — é o que o olho enxerga. */
function flatten(color, background) {
  const [r, g, b, a] = color
  const [br, bg, bb] = background
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1]
}

function luminance([r, g, b]) {
  const channel = (value) => {
    const srgb = value / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(foreground, background) {
  const light = Math.max(luminance(foreground), luminance(background))
  const dark = Math.min(luminance(foreground), luminance(background))
  return (light + 0.05) / (dark + 0.05)
}

/* ------------------------------------------------------------- os pares */

/** min: 4.5 texto normal · 3.0 texto grande, ícone, borda de componente. */
const PAIRS = [
  { label: 'texto forte sobre fundo', fg: '--text-strong', bg: '--bg-base', min: 4.5 },
  { label: 'texto primário sobre fundo', fg: '--text-primary', bg: '--bg-base', min: 4.5 },
  { label: 'texto secundário sobre fundo', fg: '--text-secondary', bg: '--bg-base', min: 4.5 },
  // Antes cobrado como texto grande (3:1). O tom de apoio carrega legenda,
  // dica e resumo em tamanho normal, então a exigência correta é 4,5:1.
  { label: 'texto apagado sobre fundo', fg: '--text-muted', bg: '--bg-base', min: 4.5 },
  { label: 'texto apagado sobre superfície', fg: '--text-muted', bg: '--surface-solid', min: 4.5 },
  { label: 'texto forte sobre superfície', fg: '--text-strong', bg: '--surface-solid', min: 4.5 },
  { label: 'acento sobre fundo (texto grande/ícone)', fg: '--accent', bg: '--bg-base', min: 3 },
  // O botão primário usa o gradiente âmbar nos dois temas, não o token --accent
  // (que serve a texto e ícone). Medimos a cor que de fato é pintada atrás.
  { label: 'texto sobre botão primário (topo)', fg: '--text-on-accent', bg: '--amber-300', min: 4.5 },
  { label: 'texto sobre botão primário (base)', fg: '--text-on-accent', bg: '--amber-500', min: 4.5 },
  { label: 'dado (ciano) sobre fundo', fg: '--data', bg: '--bg-base', min: 3 },
  { label: 'sucesso sobre fundo', fg: '--success', bg: '--bg-base', min: 3 },
  { label: 'erro sobre fundo', fg: '--danger', bg: '--bg-base', min: 3 },
  { label: 'anel de foco sobre fundo', fg: '--accent', bg: '--bg-base', min: 3 },
]

const THEMES = [
  { name: 'escuro', tokens: darkTokens },
  { name: 'claro', tokens: lightTokens },
]

let failures = 0
const rows = []

for (const theme of THEMES) {
  const pageBackground = toRgba(resolve(theme.tokens, theme.tokens['--bg-base']))
  for (const pair of PAIRS) {
    const background = flatten(toRgba(resolve(theme.tokens, theme.tokens[pair.bg])), pageBackground)
    const foreground = flatten(toRgba(resolve(theme.tokens, theme.tokens[pair.fg])), background)
    const ratio = contrast(foreground, background)
    const ok = ratio >= pair.min
    if (!ok) failures += 1
    rows.push(
      `${ok ? '  ok ' : 'FALHA'}  ${theme.name.padEnd(7)} ${pair.label.padEnd(42)} ${ratio.toFixed(2)}:1 (mín. ${pair.min})`,
    )
  }
}

console.log('Contraste dos tokens — WCAG 2.2 AA\n')
console.log(rows.join('\n'))
console.log(`\n${rows.length} pares verificados · ${failures} abaixo do mínimo`)

process.exit(failures > 0 ? 1 : 0)
