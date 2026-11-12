/**
 * IA Studio — montagem e análise estrutural de prompts.
 *
 * Importante: isto é composição de texto por regras locais, não uma IA
 * conectada. O produto não chama modelo de linguagem nenhum nesta etapa, e a
 * interface precisa dizer isso. A arquitetura deixa a porta aberta para uma
 * integração futura, sempre com a credencial no servidor.
 */

export interface PromptDraft {
  title: string
  category: string
  role: string
  context: string
  goal: string
  inputs: string[]
  method: string[]
  constraints: string[]
  quality: string[]
  outputFormat: string
  review: string
}

export const EMPTY_PROMPT: PromptDraft = {
  title: '',
  category: 'geral',
  role: '',
  context: '',
  goal: '',
  inputs: [],
  method: [],
  constraints: [],
  quality: [],
  outputFormat: '',
  review: '',
}

export const PROMPT_CATEGORIES = [
  'geral',
  'sites',
  'copy',
  'redes',
  'video',
  'vendas',
  'atendimento',
  'pesquisa',
  'operacao',
] as const

const SECTION_TITLES = {
  role: 'PAPEL',
  context: 'CONTEXTO',
  goal: 'OBJETIVO',
  inputs: 'ENTRADAS',
  method: 'MÉTODO',
  constraints: 'RESTRIÇÕES',
  quality: 'CRITÉRIOS DE QUALIDADE',
  outputFormat: 'FORMATO DA ENTREGA',
  review: 'REVISÃO FINAL',
} as const

function block(title: string, body: string): string[] {
  const trimmed = body.trim()
  return trimmed === '' ? [] : [`## ${title}`, trimmed, '']
}

function listBlock(title: string, items: string[]): string[] {
  const filled = items.map((item) => item.trim()).filter((item) => item !== '')
  return filled.length === 0 ? [] : [`## ${title}`, ...filled.map((item) => `- ${item}`), '']
}

/** Monta o texto final do prompt. Seção vazia simplesmente não aparece. */
export function composePrompt(draft: PromptDraft): string {
  return [
    ...block(SECTION_TITLES.role, draft.role),
    ...block(SECTION_TITLES.context, draft.context),
    ...block(SECTION_TITLES.goal, draft.goal),
    ...listBlock(SECTION_TITLES.inputs, draft.inputs),
    ...listBlock(SECTION_TITLES.method, draft.method),
    ...listBlock(SECTION_TITLES.constraints, draft.constraints),
    ...listBlock(SECTION_TITLES.quality, draft.quality),
    ...block(SECTION_TITLES.outputFormat, draft.outputFormat),
    ...block(SECTION_TITLES.review, draft.review),
  ]
    .join('\n')
    .trim()
}

/* ------------------------------------------------------------- Variáveis */

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_ áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ-]{1,60}?)\s*\}\}/g

/** Extrai as variáveis `{{nome}}` do prompt, sem repetir e na ordem de uso. */
export function extractVariables(text: string): string[] {
  const found: string[] = []
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    const name = match[1]?.trim()
    if (name && !found.includes(name)) found.push(name)
  }
  return found
}

/** Substitui as variáveis preenchidas; as vazias continuam visíveis. */
export function fillVariables(text: string, values: Record<string, string>): string {
  return text.replace(VARIABLE_PATTERN, (original, rawName: string) => {
    const value = values[rawName.trim()]
    return value && value.trim() !== '' ? value : original
  })
}

/* ------------------------------------------------- Análise estrutural */

export type FindingLevel = 'falta' | 'melhoria' | 'ok'

export interface Finding {
  level: FindingLevel
  message: string
}

const VAGUE_TERMS = ['bom', 'bonito', 'legal', 'incrível', 'otimizado', 'moderno', 'profissional', 'de qualidade']

/**
 * Revisor estrutural: regras locais que apontam o que falta em um prompt.
 * Não julga o conteúdo — julga a estrutura, que é o que dá para verificar
 * sem executar o prompt em lugar nenhum.
 */
export function reviewPrompt(draft: PromptDraft): Finding[] {
  const findings: Finding[] = []

  if (draft.role.trim() === '') {
    findings.push({ level: 'falta', message: 'Sem papel definido, a resposta sai com o tom padrão do modelo.' })
  }
  if (draft.goal.trim() === '') {
    findings.push({ level: 'falta', message: 'Sem objetivo, não há como saber se a resposta serviu.' })
  }
  if (draft.context.trim() === '') {
    findings.push({
      level: 'melhoria',
      message: 'Sem contexto (negócio, público, situação), a resposta vem genérica.',
    })
  }
  if (draft.outputFormat.trim() === '') {
    findings.push({
      level: 'falta',
      message: 'Sem formato de entrega, você recebe texto corrido onde queria lista, tabela ou arquivo.',
    })
  }
  if (draft.constraints.length === 0) {
    findings.push({
      level: 'melhoria',
      message: 'Restrições (tamanho, tom, o que não fazer) são o que evita a resposta inflada.',
    })
  }
  if (draft.quality.length === 0) {
    findings.push({
      level: 'melhoria',
      message: 'Critérios de qualidade transformam "ficou bom?" em verificação objetiva.',
    })
  }
  if (draft.method.length === 0) {
    findings.push({
      level: 'melhoria',
      message: 'Um método em passos costuma render resposta mais consistente que um pedido solto.',
    })
  }

  // Só o texto escrito pelo usuário: os títulos das seções contêm palavras
  // que a lista marcaria por engano (por exemplo "CRITÉRIOS DE QUALIDADE").
  const text = [
    draft.role,
    draft.context,
    draft.goal,
    draft.outputFormat,
    draft.review,
    ...draft.inputs,
    ...draft.method,
    ...draft.constraints,
    ...draft.quality,
  ]
    .join(' ')
    .toLowerCase()
  const vague = VAGUE_TERMS.filter((term) => new RegExp(`\\b${term}\\b`).test(text))
  if (vague.length > 0) {
    findings.push({
      level: 'melhoria',
      message: `Termo subjetivo no prompt (${vague.join(', ')}). Troque por critério verificável — "bom" não é instrução.`,
    })
  }

  if (draft.review.trim() === '') {
    findings.push({
      level: 'melhoria',
      message: 'Pedir uma revisão final antes de entregar reduz erro bobo na resposta.',
    })
  }

  if (findings.length === 0) {
    findings.push({ level: 'ok', message: 'Estrutura completa: papel, contexto, objetivo, método, limites e formato.' })
  }

  return findings
}

/** Pontos cobertos, para a interface mostrar progresso de estruturação. */
export function completeness(draft: PromptDraft): number {
  const parts = [
    draft.role.trim() !== '',
    draft.context.trim() !== '',
    draft.goal.trim() !== '',
    draft.inputs.length > 0,
    draft.method.length > 0,
    draft.constraints.length > 0,
    draft.quality.length > 0,
    draft.outputFormat.trim() !== '',
    draft.review.trim() !== '',
  ]
  return Math.round((parts.filter(Boolean).length / parts.length) * 100)
}
