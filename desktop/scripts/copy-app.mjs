// Copia o build do aplicativo (gerado no projeto principal) para desktop/app/,
// que é o que o Electron empacota. Não reconstrói sozinho: se dist-app/ não
// existir ou estiver desatualizado, rode primeiro `npm run build:app` na raiz
// do projeto (ver desktop/README.md).
import { cpSync, existsSync, rmSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const desktopRoot = join(here, '..')
const source = join(desktopRoot, '..', 'dist-app')
const dest = join(desktopRoot, 'app')

if (!existsSync(source)) {
  console.error(
    '\nFalta o build do aplicativo.\n' +
      'Rode, na raiz do projeto (uma pasta acima de desktop/):\n\n' +
      '  npm run build:app -- --outDir dist-app\n\n' +
      'e depois rode este comando de novo.\n',
  )
  process.exit(1)
}

const indexHtml = readFileSync(join(source, 'index.html'), 'utf8')
if (!indexHtml.includes('<div id="root">')) {
  console.error('dist-app/index.html não parece ser o build do aplicativo. Gere de novo com `npm run build:app`.')
  process.exit(1)
}

rmSync(dest, { recursive: true, force: true })
cpSync(source, dest, { recursive: true })
console.log(`Copiado ${source} → ${dest}`)
