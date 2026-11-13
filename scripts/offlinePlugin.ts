import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import type { Plugin } from 'vite'

// Arquivos que não fazem parte do aplicativo em si.
const IGNORED = new Set(['sw.js', '_redirects'])

function listFiles(root: string, dir = root): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return listFiles(root, full)
    return [relative(root, full).split('\\').join('/')]
  })
}

/**
 * Depois do build, gera `sw.js` na pasta de saída com a lista exata dos
 * arquivos publicados e uma versão derivada do conteúdo deles: qualquer
 * mudança no app muda a versão e o navegador baixa o novo worker.
 */
export function offlinePlugin(): Plugin {
  let outDir = ''
  let root = ''
  return {
    name: 'metodo-ia-pro:offline',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
      root = config.root
    },
    writeBundle() {
      const dir = resolve(root, outDir)
      const files = listFiles(dir).filter((file) => !IGNORED.has(file)).sort()
      const hash = createHash('sha256')
      for (const file of files) hash.update(file).update(readFileSync(join(dir, file)))
      const version = hash.digest('hex').slice(0, 12)
      const template = readFileSync(join(root, 'scripts', 'sw-template.js'), 'utf8')
      const source = template.replace('__VERSION__', version).replace('__FILES__', JSON.stringify(files, null, 2))
      writeFileSync(join(dir, 'sw.js'), source)
    },
  }
}
