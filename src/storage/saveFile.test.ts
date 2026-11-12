import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveTextFile } from './saveFile'

describe('saveTextFile', () => {
  afterEach(() => vi.restoreAllMocks())

  it('no navegador (fora do app nativo) baixa o arquivo por link', async () => {
    const click = vi.fn()
    const anchor = { click, href: '', download: '' } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)
    URL.createObjectURL = vi.fn(() => 'blob:teste')
    URL.revokeObjectURL = vi.fn()

    const result = await saveTextFile('backup.json', '{"ok":true}')

    expect(result).toBe('baixado')
    expect(anchor.download).toBe('backup.json')
    expect(click).toHaveBeenCalledOnce()
  })
})
