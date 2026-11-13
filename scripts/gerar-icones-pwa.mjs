// Gera os ícones PNG do PWA a partir do desenho da marca (public/logo.svg).
// Rode só quando a marca mudar; os PNGs ficam versionados em public/icons/.
//   node scripts/gerar-icones-pwa.mjs
// Precisa do Playwright com Chromium instalado (não é dependência do projeto).
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let chromium
try {
  ;({ chromium } = require('playwright'))
} catch {
  ;({ chromium } = require('/opt/npm-tools/node_modules/playwright'))
}

const MARK = `
  <g transform="translate(24 24) scale(0.66) translate(-24 -24)" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M10 38V14l14 17" stroke="#F4F7FB"/>
    <path d="M38 14v24" stroke="#F4F7FB"/>
    <path d="m24 31 14.5-21.5" stroke="#EEB04A"/>
  </g>`

// "any": cantos arredondados, fundo transparente fora do quadrado.
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#0B0F15"/>${MARK}</svg>`
// "maskable" e iOS: quadrado cheio; o sistema aplica a própria máscara. A
// marca fica dentro dos 80% centrais (zona segura exigida pelo Android).
const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#0B0F15"/>${MARK}</svg>`

const jobs = [
  ['icon-192.png', rounded, 192, true],
  ['icon-512.png', rounded, 512, true],
  ['icon-maskable-512.png', full, 512, false],
  ['apple-touch-icon.png', full, 180, false],
]

mkdirSync('public/icons', { recursive: true })
const browser = await chromium.launch()
for (const [name, svg, size, transparent] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`)
  const png = await page.screenshot({ omitBackground: transparent, type: 'png' })
  writeFileSync(`public/icons/${name}`, png)
  await page.close()
  console.log('gerado', name, png.length, 'bytes')
}
await browser.close()
