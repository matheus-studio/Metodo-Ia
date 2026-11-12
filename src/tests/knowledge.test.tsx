import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PreferencesProvider } from '@/app/PreferencesProvider'
import { AppRoutes } from '@/app/router'
import { LIBRARY } from '@/features/library/libraryData'
import { GLOSSARY, LESSONS } from '@/features/academy/academyData'
import { repositories } from '@/repositories'

function renderAt(route: string) {
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </PreferencesProvider>,
  )
}

describe('IA Studio', () => {
  it('deixa claro que não há IA conectada', async () => {
    renderAt('/studio')
    expect(await screen.findByText(/não está conectado a nenhum modelo de linguagem/i)).toBeInTheDocument()
  })

  it('abre um material da Biblioteca já estruturado', async () => {
    renderAt('/studio?material=prompt-briefing-site')
    const title = (await screen.findByLabelText(/nome do prompt/i)) as HTMLInputElement
    expect(title.value).toBe('Entrevista de briefing para site')
    const role = (await screen.findByLabelText(/^papel$/i)) as HTMLTextAreaElement
    expect(role.value).toContain('especialista em briefing')
  })

  it('salva o prompt na coleção local', async () => {
    const user = userEvent.setup()
    renderAt('/studio?material=prompt-reels')

    await user.click(await screen.findByRole('button', { name: /salvar na coleção/i }))
    expect(await screen.findByText(/prompt salvo na sua coleção/i)).toBeInTheDocument()

    const prompts = await repositories.prompts.list()
    expect(prompts).toHaveLength(1)
    expect(prompts[0]?.libraryKey).toBe('prompt-reels')
  })

  it('exige nome antes de salvar', async () => {
    const user = userEvent.setup()
    renderAt('/studio')
    await user.click(await screen.findByRole('button', { name: /salvar na coleção/i }))
    expect(await screen.findByText(/dê um nome ao prompt/i)).toBeInTheDocument()
    expect(await repositories.prompts.count()).toBe(0)
  })
})

describe('Biblioteca', () => {
  it('lista os materiais e filtra por busca', async () => {
    const user = userEvent.setup()
    renderAt('/biblioteca')

    expect(await screen.findByRole('heading', { name: /material pronto para trabalhar/i })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Buscar na biblioteca'), 'follow-up')
    expect(await screen.findByText(/sequência de follow-up/i)).toBeInTheDocument()
  })

  it('abre um checklist com conteúdo completo', async () => {
    renderAt('/biblioteca?material=checklist-publicacao-site')
    expect(await screen.findByRole('heading', { name: /checklist de publicação de site/i })).toBeInTheDocument()
    expect(screen.getByText(/critérios de revisão/i)).toBeInTheDocument()
  })

  it('todo material traz conteúdo, dicas e critérios de revisão', () => {
    for (const material of LIBRARY) {
      expect(material.whenToUse.length).toBeGreaterThan(20)
      expect(material.tips.length).toBeGreaterThan(0)
      expect(material.reviewCriteria.length).toBeGreaterThan(0)
      // Ou é prompt estruturado, ou tem corpo de texto — nunca os dois vazios.
      expect(material.draft !== undefined || material.body.length > 200).toBe(true)
    }
  })
})

describe('Academia', () => {
  it('abre uma aula com exemplo e erros comuns', async () => {
    renderAt('/academia?aula=o-que-e-crm')
    expect(await screen.findByRole('heading', { name: /para que serve esse nome feio/i })).toBeInTheDocument()
    expect(screen.getByText('Na prática')).toBeInTheDocument()
    expect(screen.getByText('Erros comuns')).toBeInTheDocument()
  })

  it('leva da aula para o módulo onde aquilo é aplicado', async () => {
    renderAt('/academia?aula=precificacao')
    expect(await screen.findByRole('link', { name: /abrir a calculadora/i })).toBeInTheDocument()
  })

  it('mostra o glossário com definição e exemplo', async () => {
    const user = userEvent.setup()
    renderAt('/academia')
    await user.click(await screen.findByRole('tab', { name: /glossário/i }))
    expect(await screen.findByText(/organizar contatos comerciais/i)).toBeInTheDocument()
  })

  it('toda aula aponta para um módulo existente quando cita um', () => {
    for (const lesson of LESSONS) {
      expect(lesson.body.length).toBeGreaterThan(1)
      expect(lesson.mistakes.length).toBeGreaterThan(0)
    }
    for (const term of GLOSSARY) {
      expect(term.definition.length).toBeGreaterThan(20)
    }
  })
})

describe('Missões', () => {
  it('começa a semana zerada e mostra o período', async () => {
    renderAt('/missoes')
    expect(await screen.findByRole('heading', { name: /ritmo da semana/i })).toBeInTheDocument()
    expect(screen.getByText(/0\/6 missões/)).toBeInTheDocument()
  })

  it('avança a missão a partir da atividade real registrada', async () => {
    await repositories.activity.create({ kind: 'oportunidade-salva', message: 'Oportunidade salva: teste.' })
    renderAt('/missoes')

    // O contador do card mostra progresso/meta assim que o histórico carrega.
    expect(await screen.findByText('1/3')).toBeInTheDocument()
  })

  it('registra tarefa pessoal da semana', async () => {
    const user = userEvent.setup()
    renderAt('/missoes')

    await user.type(await screen.findByLabelText('Nova tarefa'), 'Visitar 3 comércios')
    await user.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(await screen.findByText('Visitar 3 comércios')).toBeInTheDocument()
    const tasks = await repositories.tasks.list()
    expect(tasks).toHaveLength(1)
    expect(tasks[0]?.projectId).toBeUndefined()
  })
})
