import { describe, expect, it } from 'vitest'
import type { Project, ProjectStatus, Task } from '@/types/domain'
import { BRIEFING_TEMPLATES, briefingTemplate } from './briefingTemplates'
import { canAdvance, nextProjectStatus, projectAdvice, projectProgress } from './projectLogic'

function makeProject(patch: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    name: 'Site da Cantina',
    status: 'briefing' as ProjectStatus,
    briefing: [],
    deliverables: [],
    ...patch,
  }
}

function makeTask(patch: Partial<Task> = {}): Task {
  return {
    id: `t${Math.random()}`,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    title: 'Montar página',
    projectId: 'p1',
    done: false,
    ...patch,
  }
}

describe('nextProjectStatus', () => {
  it('segue a ordem briefing → planejamento → execução → revisão → entregue', () => {
    expect(nextProjectStatus('briefing')).toBe('planejamento')
    expect(nextProjectStatus('planejamento')).toBe('execucao')
    expect(nextProjectStatus('execucao')).toBe('revisao')
    expect(nextProjectStatus('revisao')).toBe('entregue')
  })

  it('não avança além da entrega', () => {
    expect(nextProjectStatus('entregue')).toBeNull()
  })
})

describe('projectProgress', () => {
  it('é zero sem tarefas e sem entregáveis, mesmo em execução', () => {
    const progress = projectProgress(makeProject({ status: 'execucao' }), [])
    expect(progress.percent).toBe(0)
  })

  it('conta tarefas e entregáveis juntos', () => {
    const project = makeProject({
      deliverables: [
        { id: 'd1', title: 'Página publicada', done: true },
        { id: 'd2', title: 'Cardápio', done: false },
      ],
    })
    const tasks = [makeTask({ done: true }), makeTask({ done: false })]
    // 2 de 4 concluídos
    expect(projectProgress(project, tasks).percent).toBe(50)
  })

  it('ignora tarefas de outros projetos', () => {
    const tasks = [makeTask({ done: true }), makeTask({ projectId: 'outro', done: true })]
    const progress = projectProgress(makeProject(), tasks)
    expect(progress.tasksTotal).toBe(1)
  })

  it('conta respostas de briefing preenchidas', () => {
    const project = makeProject({
      briefing: [
        { question: 'A?', answer: 'sim' },
        { question: 'B?', answer: '   ' },
      ],
    })
    const progress = projectProgress(project, [])
    expect(progress.briefingAnswered).toBe(1)
    expect(progress.briefingTotal).toBe(2)
  })
})

describe('projectAdvice e canAdvance', () => {
  it('exige briefing antes de sair da primeira etapa', () => {
    const project = makeProject()
    expect(projectAdvice(project, [])[0]?.blocking).toBe(true)
    expect(canAdvance(project, [])).toBe(false)
  })

  it('libera o avanço com o briefing preenchido', () => {
    const project = makeProject({ briefing: [{ question: 'A?', answer: 'resposta' }] })
    expect(canAdvance(project, [])).toBe(true)
  })

  it('avisa sem bloquear quando faltam respostas', () => {
    const project = makeProject({
      briefing: [
        { question: 'A?', answer: 'ok' },
        { question: 'B?', answer: '' },
      ],
    })
    const advice = projectAdvice(project, [])
    expect(advice[0]?.blocking).toBe(false)
    expect(canAdvance(project, [])).toBe(true)
  })

  it('exige tarefas antes de sair do planejamento', () => {
    const project = makeProject({ status: 'planejamento' })
    expect(canAdvance(project, [])).toBe(false)
  })

  it('bloqueia a entrega enquanto houver entregável sem aprovação registrada', () => {
    const project = makeProject({
      status: 'revisao',
      deliverables: [{ id: 'd1', title: 'Página', done: true }],
    })
    expect(canAdvance(project, [])).toBe(false)

    const aprovado = makeProject({
      status: 'revisao',
      deliverables: [{ id: 'd1', title: 'Página', done: true, approvedAt: '2026-02-01T00:00:00.000Z' }],
    })
    expect(canAdvance(aprovado, [])).toBe(true)
  })

  it('projeto entregue não oferece avanço', () => {
    expect(canAdvance(makeProject({ status: 'entregue' }), [])).toBe(false)
  })
})

describe('modelos de briefing', () => {
  it('têm chave única e perguntas suficientes', () => {
    const keys = new Set(BRIEFING_TEMPLATES.map((template) => template.key))
    expect(keys.size).toBe(BRIEFING_TEMPLATES.length)
    for (const template of BRIEFING_TEMPLATES) {
      expect(template.questions.length).toBeGreaterThanOrEqual(5)
      expect(template.questions.every((question) => question.endsWith('?'))).toBe(true)
    }
  })

  it('busca por chave e devolve indefinido para chave desconhecida', () => {
    expect(briefingTemplate('site')?.label).toBe('Site ou landing page')
    expect(briefingTemplate('inexistente')).toBeUndefined()
  })
})
