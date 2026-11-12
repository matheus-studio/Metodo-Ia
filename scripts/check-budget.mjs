#!/usr/bin/env node
/**
 * Orçamento de carga. Roda sobre `dist/` depois do build (`npm run budget`).
 *
 * Mede o que o navegador baixa ao abrir o aplicativo — HTML, CSS de base,
 * runtime, vendor e o chunk do painel — e falha se passar do teto. Não
 * substitui medição de campo (LCP/INP/CLS), que exige navegador real; serve
 * para impedir que uma dependência nova entre sem ninguém perceber.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const DIST = new URL('../dist/', import.meta.url).pathname

// Tetos em kB comprimidos (gzip).
const BUDGETS = {
  // A raiz do aplicativo é o painel: este é o único primeiro carregamento que
  // existe. O teto impede que catálogo, biblioteca ou academia sejam puxados
  // para o chunk de entrada só para mostrar um número.
  primeiroCarregamento: 120,
  maiorChunkDeRota: 30,
  cssTotalDeEntrada: 12,
}

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

let files
try {
  files = walk(DIST)
} catch {
  console.error('dist/ não encontrado. Rode `npm run build` antes de `npm run budget`.')
  process.exit(1)
}

const measured = files.map((path) => {
  const content = readFileSync(path)
  return {
    name: path.replace(DIST, ''),
    raw: content.length,
    gzip: gzipSync(content, { level: 9 }).length,
  }
})

const kb = (bytes) => bytes / 1024

const byName = (pattern) => measured.filter((file) => pattern.test(file.name))

const html = byName(/^index\.html$/)
const entryJs = byName(/^assets\/index-.*\.js$/)
const runtime = byName(/rolldown-runtime.*\.js$/)
const vendor = byName(/^assets\/vendor-.*\.js$/)
const entryCss = byName(/^assets\/index-.*\.css$/)
const dashboard = byName(/DashboardPage-.*\.(js|css)$/)
// Script bloqueante que define o tema antes do primeiro paint.
const themeInit = byName(/^theme-init\.js$/)
// Repositórios e barramento entram no caminho do painel.
const shared = byName(/^assets\/(dataBus|useCollection)-.*\.js$/)

const firstLoad = [...html, ...themeInit, ...runtime, ...entryJs, ...vendor, ...entryCss, ...dashboard, ...shared]
const firstLoadGzip = firstLoad.reduce((total, file) => total + file.gzip, 0)

const routeChunks = measured.filter(
  (file) => /^assets\/.*\.js$/.test(file.name) && !/vendor-|rolldown-runtime|^assets\/index-/.test(file.name),
)
const biggestRoute = routeChunks.sort((a, b) => b.gzip - a.gzip)[0]
const entryCssGzip = entryCss.reduce((total, file) => total + file.gzip, 0)

const checks = [
  { label: 'Primeiro carregamento (painel)', value: kb(firstLoadGzip), budget: BUDGETS.primeiroCarregamento },
  {
    label: `Maior chunk de rota (${biggestRoute?.name ?? '—'})`,
    value: kb(biggestRoute?.gzip ?? 0),
    budget: BUDGETS.maiorChunkDeRota,
  },
  { label: 'CSS de entrada', value: kb(entryCssGzip), budget: BUDGETS.cssTotalDeEntrada },
]

console.log('Orçamento de carga (kB comprimidos)\n')
for (const file of firstLoad.sort((a, b) => b.gzip - a.gzip)) {
  console.log(`        ${file.name.padEnd(52)} ${kb(file.gzip).toFixed(1)}`)
}
console.log('')

let failures = 0
for (const check of checks) {
  const ok = check.value <= check.budget
  if (!ok) failures += 1
  console.log(
    `${ok ? '  ok ' : 'FALHA'}  ${check.label.padEnd(52)} ${check.value.toFixed(1)} / ${check.budget}`,
  )
}

const total = measured.reduce((sum, file) => sum + file.gzip, 0)
console.log(`\nTotal publicado: ${kb(total).toFixed(1)} kB comprimidos em ${measured.length} arquivos`)
console.log(`${failures} verificação(ões) acima do orçamento`)

process.exit(failures > 0 ? 1 : 0)
