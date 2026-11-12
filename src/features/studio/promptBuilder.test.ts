import { describe, expect, it } from 'vitest'
import {
  completeness,
  composePrompt,
  EMPTY_PROMPT,
  extractVariables,
  fillVariables,
  reviewPrompt,
} from './promptBuilder'
import type { PromptDraft } from './promptBuilder'

const full: PromptDraft = {
  title: 'Descrições de cardápio',
  category: 'sites',
  role: 'Você escreve descrições de cardápio.',
  context: 'O restaurante é {{restaurante}}.',
  goal: 'Escrever uma descrição curta por prato.',
  inputs: ['Lista de pratos'],
  method: ['Comece pelo ingrediente principal'],
  constraints: ['Máximo de 20 palavras por prato'],
  quality: ['Nenhum ingrediente fora da lista'],
  outputFormat: 'Tabela com três colunas.',
  review: 'Confira item por item.',
}

describe('composePrompt', () => {
  it('monta as seções na ordem definida', () => {
    const text = composePrompt(full)
    expect(text.indexOf('## PAPEL')).toBeLessThan(text.indexOf('## CONTEXTO'))
    expect(text.indexOf('## OBJETIVO')).toBeLessThan(text.indexOf('## MÉTODO'))
    expect(text.indexOf('## FORMATO DA ENTREGA')).toBeLessThan(text.indexOf('## REVISÃO FINAL'))
  })

  it('omite seção vazia em vez de deixar título órfão', () => {
    const text = composePrompt({ ...full, review: '', constraints: [] })
    expect(text).not.toContain('REVISÃO FINAL')
    expect(text).not.toContain('RESTRIÇÕES')
  })

  it('devolve texto vazio para prompt em branco', () => {
    expect(composePrompt(EMPTY_PROMPT)).toBe('')
  })
})

describe('variáveis', () => {
  it('extrai na ordem de uso, sem repetir', () => {
    const text = 'O {{negocio}} em {{cidade}} atende {{negocio}}.'
    expect(extractVariables(text)).toEqual(['negocio', 'cidade'])
  })

  it('aceita acento e espaço no nome', () => {
    expect(extractVariables('{{ nome do negócio }}')).toEqual(['nome do negócio'])
  })

  it('substitui apenas as preenchidas e mantém visíveis as vazias', () => {
    const text = 'O {{negocio}} em {{cidade}}.'
    expect(fillVariables(text, { negocio: 'Cantina', cidade: '  ' })).toBe('O Cantina em {{cidade}}.')
  })

  it('não quebra quando não há variável nenhuma', () => {
    expect(fillVariables('Texto simples', { a: 'b' })).toBe('Texto simples')
  })
})

describe('reviewPrompt', () => {
  it('aponta papel, objetivo e formato ausentes como falta', () => {
    const findings = reviewPrompt(EMPTY_PROMPT)
    const faltas = findings.filter((item) => item.level === 'falta').map((item) => item.message).join(' ')
    expect(faltas).toContain('papel')
    expect(faltas).toContain('objetivo')
    expect(faltas).toContain('formato')
  })

  it('aprova um prompt completo', () => {
    const findings = reviewPrompt(full)
    expect(findings).toHaveLength(1)
    expect(findings[0]?.level).toBe('ok')
  })

  it('sinaliza termo subjetivo usado como critério', () => {
    const findings = reviewPrompt({ ...full, quality: ['O texto precisa ficar bom e profissional'] })
    expect(findings.some((item) => item.message.includes('subjetivo'))).toBe(true)
  })

  it('sugere método e critérios quando faltam, sem tratar como falta grave', () => {
    const findings = reviewPrompt({ ...full, method: [], quality: [] })
    expect(findings.every((item) => item.level !== 'falta')).toBe(true)
    expect(findings.length).toBeGreaterThanOrEqual(2)
  })
})

describe('completeness', () => {
  it('é 0 no prompt vazio e 100 no completo', () => {
    expect(completeness(EMPTY_PROMPT)).toBe(0)
    expect(completeness(full)).toBe(100)
  })

  it('cresce conforme blocos são preenchidos', () => {
    const parcial = { ...EMPTY_PROMPT, role: 'Papel', goal: 'Objetivo' }
    const valor = completeness(parcial)
    expect(valor).toBeGreaterThan(0)
    expect(valor).toBeLessThan(100)
  })
})
