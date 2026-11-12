import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/app/PreferencesProvider'
import { AppRoutes } from '@/app/router'
import { repositories } from '@/repositories'
import { importBackup, parseBackup } from '@/storage/backup'
import { readPreferences } from '@/storage/preferences'
import { PREFERENCES_KEY } from '@/storage/preferences'

function sourceFiles(dir = 'src'): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full))
    // Os próprios testes citam os padrões procurados; ficam fora da varredura.
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

describe('superfície de ataque do código', () => {
  const files = sourceFiles()

  it('não usa dangerouslySetInnerHTML em lugar nenhum', () => {
    const offenders = files.filter((file) => readFileSync(file, 'utf8').includes('dangerouslySetInnerHTML'))
    expect(offenders).toEqual([])
  })

  it('não usa eval nem new Function', () => {
    const offenders = files.filter((file) => /\beval\(|new Function\(/.test(readFileSync(file, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('não usa innerHTML nem document.write', () => {
    const offenders = files.filter((file) => /\.innerHTML\s*=|document\.write\(/.test(readFileSync(file, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('todo link que abre em nova aba leva rel="noopener"', () => {
    const offenders = files.filter((file) => {
      const content = readFileSync(file, 'utf8')
      if (!content.includes('target="_blank"')) return false
      return !content.includes('noopener')
    })
    expect(offenders).toEqual([])
  })

  it('não há credencial embutida no código-fonte', () => {
    const patterns = [/sk-[A-Za-z0-9]{20,}/, /AIza[0-9A-Za-z_-]{30,}/, /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]{16,}/i]
    const offenders = files.filter((file) => {
      const content = readFileSync(file, 'utf8')
      return patterns.some((pattern) => pattern.test(content))
    })
    expect(offenders).toEqual([])
  })
})

describe('CSP e inicialização do tema', () => {
  // Regressão: o tema era definido por <script> inline, incompatível com a CSP
  // "script-src 'self'" configurada no Netlify e no Vercel.
  it('index.html não tem script inline', () => {
    const html = readFileSync('index.html', 'utf8')
    const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)]
      .map((match) => (match[1] ?? '').trim())
      .filter((content) => content !== '')
    expect(inline).toEqual([])
  })

  it('o tema é carregado de um arquivo externo, antes do aplicativo', () => {
    const html = readFileSync('index.html', 'utf8')
    expect(html).toContain('theme-init.js')
    expect(html.indexOf('theme-init.js')).toBeLessThan(html.indexOf('/src/main.tsx'))
    expect(readFileSync('public/theme-init.js', 'utf8')).toContain('dataset.theme')
  })

  it('a CSP publicada não libera script inline', () => {
    for (const file of ['netlify.toml', 'vercel.json']) {
      const content = readFileSync(file, 'utf8')
      expect(content).toContain("script-src 'self'")
      expect(content).not.toMatch(/script-src[^;"']*unsafe-inline/)
    }
  })
})

describe('dados vindos do usuário são tratados como texto', () => {
  it('conteúdo com marcação HTML aparece escapado na tela, não executado', async () => {
    const payload = '<img src=x onerror="document.title=\'invadido\'">'
    await repositories.companies.create({
      name: payload,
      segment: 'Teste',
      city: 'Curitiba',
      digitalPresence: 'site-nao-confirmado',
      source: 'manual',
    })

    render(
      <PreferencesProvider>
        <MemoryRouter initialEntries={['/crm?aba=empresas']}>
          <AppRoutes />
        </MemoryRouter>
      </PreferencesProvider>,
    )

    expect(await screen.findByText(payload)).toBeInTheDocument()
    expect(document.querySelector('img[src="x"]')).toBeNull()
    expect(document.title).not.toBe('invadido')
  })

  it('site com esquema executável não vira link clicável', async () => {
    await repositories.companies.create({
      name: 'Empresa com link hostil',
      segment: 'Teste',
      city: 'Curitiba',
      website: 'javascript:alert(1)',
      digitalPresence: 'site-identificado',
      source: 'manual',
    })

    render(
      <PreferencesProvider>
        <MemoryRouter initialEntries={['/crm?aba=empresas']}>
          <AppRoutes />
        </MemoryRouter>
      </PreferencesProvider>,
    )

    await screen.findByText('Empresa com link hostil')
    expect(screen.queryByRole('link', { name: /abrir site/i })).toBeNull()
  })
})

describe('entrada persistida é revalidada na leitura', () => {
  it('preferências adulteradas não derrubam o aplicativo', () => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ theme: { toString: 'x' }, skills: 'não é lista' }))
    const prefs = readPreferences()
    expect(prefs.theme).toBe('dark')
    expect(prefs.skills).toEqual([])
  })

  it('backup não cria coleção nova nem herda propriedade de protótipo', async () => {
    const file = parseBackup(
      JSON.stringify({
        format: 'metodo-ia-pro/backup',
        version: 1,
        collections: {
          __proto__: [{ id: 'x' }],
          naoExiste: [{ id: 'y' }],
          tasks: [{ id: 'ok', title: 'Tarefa', done: false }],
        },
      }),
    )
    const summary = await importBackup(file)
    expect(summary.imported).toBe(1)
    expect(Object.keys(file.collections)).toEqual(['tasks'])
  })

  it('backup gigante é recusado antes de ser processado', () => {
    const huge = `{"format":"metodo-ia-pro/backup","version":1,"collections":{"companies":[${'{"id":"a"},'.repeat(1_300_000)}]}}`
    expect(() => parseBackup(huge)).toThrow(/grande demais/i)
  })
})
