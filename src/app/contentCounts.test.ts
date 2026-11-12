import { describe, expect, it } from 'vitest'
import { CATALOG } from '@/features/catalog/catalogData'
import { LIBRARY } from '@/features/library/libraryData'
import { GLOSSARY, LESSONS } from '@/features/academy/academyData'
import { CONTENT_COUNTS } from './contentCounts'

// O painel anuncia esses números para quem abre o aplicativo pela primeira
// vez; se o conteúdo crescer e o número não, a tela passa a mentir.
describe('contagens de conteúdo anunciadas no painel', () => {
  it('bate com o catálogo de serviços', () => {
    expect(CONTENT_COUNTS.servicos).toBe(CATALOG.length)
  })
  it('bate com a biblioteca', () => {
    expect(CONTENT_COUNTS.materiais).toBe(LIBRARY.length)
  })
  it('bate com as aulas e os termos da academia', () => {
    expect(CONTENT_COUNTS.aulas).toBe(LESSONS.length)
    expect(CONTENT_COUNTS.termos).toBe(GLOSSARY.length)
  })
})
