import { describe, expect, it } from 'vitest'
import { repositories } from '@/repositories'
import { loadDemoData, removeDemoData } from '@/services/demoData'
import { loadSnapshot } from './snapshot'

describe('snapshot do painel', () => {
  it('parte de zero quando não há registros', async () => {
    const snapshot = await loadSnapshot()
    expect(snapshot.counts.companies).toBe(0)
    expect(snapshot.hasDemoData).toBe(false)
    expect(snapshot.recentActivity).toHaveLength(0)
  })

  it('agrupa negociações por estágio', async () => {
    await repositories.deals.create({ title: 'A', stage: 'novo' })
    await repositories.deals.create({ title: 'B', stage: 'proposta' })
    await repositories.deals.create({ title: 'C', stage: 'proposta' })

    const snapshot = await loadSnapshot()
    expect(snapshot.counts.deals).toBe(3)
    expect(snapshot.dealsByStage.proposta).toBe(2)
    expect(snapshot.dealsByStage.perdido).toBe(0)
  })

  it('separa tarefas abertas das vencidas usando a data de referência', async () => {
    await repositories.tasks.create({ title: 'Vencida', done: false, dueDate: '2026-01-01' })
    await repositories.tasks.create({ title: 'Futura', done: false, dueDate: '2099-01-01' })
    await repositories.tasks.create({ title: 'Concluída', done: true })

    const snapshot = await loadSnapshot(new Date('2026-06-01T12:00:00.000Z'))
    expect(snapshot.openTasks).toHaveLength(2)
    expect(snapshot.overdueTasks.map((task) => task.title)).toEqual(['Vencida'])
  })

  it('conta no ritmo semanal apenas os contatos dentro da janela de sete dias', async () => {
    await repositories.contacts.create({ name: 'Contato 1' })
    await repositories.contacts.create({ name: 'Contato 2' })

    const agora = await loadSnapshot()
    expect(agora.counts.contacts).toBe(2)
    expect(agora.contactsThisWeek).toBe(2)

    // Dez dias depois, os mesmos contatos saem da janela sem deixar de existir.
    const depois = await loadSnapshot(new Date(Date.now() + 10 * 86_400_000))
    expect(depois.counts.contacts).toBe(2)
    expect(depois.contactsThisWeek).toBe(0)
  })

  it('sinaliza e depois limpa os dados de demonstração sem tocar nos reais', async () => {
    await repositories.companies.create({
      name: 'Empresa real do usuário',
      segment: 'Serviços',
      city: 'Curitiba',
      digitalPresence: 'site-nao-confirmado',
      source: 'manual',
    })
    await loadDemoData()

    const comDemo = await loadSnapshot()
    expect(comDemo.hasDemoData).toBe(true)

    await removeDemoData()
    const semDemo = await loadSnapshot()
    expect(semDemo.hasDemoData).toBe(false)
    expect(semDemo.counts.companies).toBe(1)
  })
})
