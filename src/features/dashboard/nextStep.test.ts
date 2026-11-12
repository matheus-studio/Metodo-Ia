import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES } from '@/types/domain'
import type { UserPreferences } from '@/types/domain'
import { EMPTY_SNAPSHOT } from './snapshot'
import type { WorkspaceSnapshot } from './snapshot'
import { journey, nextStep } from './nextStep'

const readyProfile: UserPreferences = { ...DEFAULT_PREFERENCES, onboardingDone: true, skills: ['criação de sites'] }

function snapshotWith(patch: Partial<WorkspaceSnapshot>): WorkspaceSnapshot {
  return {
    ...EMPTY_SNAPSHOT,
    ...patch,
    counts: { ...EMPTY_SNAPSHOT.counts, ...patch.counts },
    dealsByStage: { ...EMPTY_SNAPSHOT.dealsByStage, ...patch.dealsByStage },
    offersByStatus: { ...EMPTY_SNAPSHOT.offersByStatus, ...patch.offersByStatus },
  }
}

describe('nextStep', () => {
  it('pede a configuração do perfil antes de qualquer outra coisa', () => {
    const result = nextStep(EMPTY_SNAPSHOT, DEFAULT_PREFERENCES)
    expect(result.id).toBe('configurar-perfil')
    expect(result.available).toBe(true)
  })

  it('com perfil pronto e nada registrado, manda explorar serviços', () => {
    const result = nextStep(EMPTY_SNAPSHOT, readyProfile)
    expect(result.id).toBe('explorar-servicos')
    expect(result.available).toBe(true)
    expect(result.module?.path).toBe('/radar/servicos')
  })

  it('marca a recomendação como disponível conforme o status do módulo', () => {
    const result = nextStep(
      snapshotWith({
        counts: { ...EMPTY_SNAPSHOT.counts, blueprints: 1, offers: 1, companies: 1, deals: 1 },
        dealsByStage: { ...EMPTY_SNAPSHOT.dealsByStage, fechado: 1 },
        offersByStatus: { ...EMPTY_SNAPSHOT.offersByStatus, enviada: 1 },
      }),
      readyProfile,
    )
    expect(result.id).toBe('iniciar-projeto')
    // Projetos foi entregue no Marco 4, então a recomendação oferece botão.
    expect(result.module?.status).toBe('disponivel')
    expect(result.available).toBe(true)
  })

  it('recomenda avançar o projeto em andamento antes de buscar mais trabalho', () => {
    const result = nextStep(
      snapshotWith({
        counts: { ...EMPTY_SNAPSHOT.counts, blueprints: 1, offers: 1, companies: 1, deals: 1, projects: 1 },
        dealsByStage: { ...EMPTY_SNAPSHOT.dealsByStage, fechado: 1 },
        offersByStatus: { ...EMPTY_SNAPSHOT.offersByStatus, enviada: 1 },
        openProjects: 1,
      }),
      readyProfile,
    )
    expect(result.id).toBe('avancar-projeto')
  })

  it('prioriza tarefa vencida sobre o restante do funil', () => {
    const snapshot = snapshotWith({
      counts: { ...EMPTY_SNAPSHOT.counts, blueprints: 2, offers: 1 },
      overdueTasks: [
        {
          id: 't1',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          title: 'Enviar proposta revisada',
          done: false,
          dueDate: '2026-01-02',
        },
      ],
    })
    const result = nextStep(snapshot, readyProfile)
    expect(result.id).toBe('tarefa-atrasada')
    expect(result.body).toContain('Enviar proposta revisada')
  })

  it('pede estruturar o serviço quando há oportunidade salva sem escopo', () => {
    const result = nextStep(snapshotWith({ counts: { ...EMPTY_SNAPSHOT.counts, opportunities: 3 } }), readyProfile)
    expect(result.id).toBe('estruturar-servico')
    expect(result.reason).toContain('3')
  })

  it('pede a oferta quando o serviço já existe', () => {
    const result = nextStep(snapshotWith({ counts: { ...EMPTY_SNAPSHOT.counts, blueprints: 1 } }), readyProfile)
    expect(result.id).toBe('criar-oferta')
  })

  it('pede cadastro de empresas quando há oferta e nenhum contato', () => {
    const result = nextStep(
      snapshotWith({ counts: { ...EMPTY_SNAPSHOT.counts, blueprints: 1, offers: 1 } }),
      readyProfile,
    )
    expect(result.id).toBe('encontrar-empresas')
  })

  it('pede abordagem quando há empresa registrada e nenhuma negociação', () => {
    const result = nextStep(
      snapshotWith({ counts: { ...EMPTY_SNAPSHOT.counts, blueprints: 1, offers: 1, companies: 4 } }),
      readyProfile,
    )
    expect(result.id).toBe('preparar-abordagem')
  })

  it('cobra o primeiro contato das negociações no estágio "novo"', () => {
    const result = nextStep(
      snapshotWith({
        counts: { ...EMPTY_SNAPSHOT.counts, blueprints: 1, offers: 1, companies: 2, deals: 2 },
        dealsByStage: { ...EMPTY_SNAPSHOT.dealsByStage, novo: 2 },
      }),
      readyProfile,
    )
    expect(result.id).toBe('abordar-novos')
  })

  it('manda enviar proposta para quem respondeu', () => {
    const result = nextStep(
      snapshotWith({
        counts: { ...EMPTY_SNAPSHOT.counts, blueprints: 1, offers: 1, companies: 2, deals: 1 },
        dealsByStage: { ...EMPTY_SNAPSHOT.dealsByStage, respondeu: 1 },
      }),
      readyProfile,
    )
    expect(result.id).toBe('enviar-proposta')
  })

  it('manda abrir o projeto após o fechamento', () => {
    const result = nextStep(
      snapshotWith({
        counts: { ...EMPTY_SNAPSHOT.counts, blueprints: 1, offers: 1, companies: 1, deals: 1 },
        dealsByStage: { ...EMPTY_SNAPSHOT.dealsByStage, fechado: 1 },
        offersByStatus: { ...EMPTY_SNAPSHOT.offersByStatus, enviada: 1 },
      }),
      readyProfile,
    )
    expect(result.id).toBe('iniciar-projeto')
  })

  it('cai na recomendação de ritmo quando não há gargalo', () => {
    const result = nextStep(
      snapshotWith({
        counts: { ...EMPTY_SNAPSHOT.counts, blueprints: 1, offers: 1, companies: 1, deals: 1, projects: 1 },
        dealsByStage: { ...EMPTY_SNAPSHOT.dealsByStage, fechado: 1 },
        offersByStatus: { ...EMPTY_SNAPSHOT.offersByStatus, enviada: 1 },
      }),
      readyProfile,
    )
    expect(result.id).toBe('manter-ritmo')
  })

  it('toda recomendação aponta para um módulo conhecido e explica o motivo', () => {
    const result = nextStep(EMPTY_SNAPSHOT, readyProfile)
    expect(result.module).toBeDefined()
    expect(result.reason.length).toBeGreaterThan(5)
  })
})

describe('journey', () => {
  it('marca etapas apenas com base em registros reais', () => {
    const steps = journey(EMPTY_SNAPSHOT)
    expect(steps.every((step) => !step.done)).toBe(true)
  })

  it('não considera a abordagem feita quando todas as negociações estão em "novo"', () => {
    const steps = journey(
      snapshotWith({
        counts: { ...EMPTY_SNAPSHOT.counts, deals: 2 },
        dealsByStage: { ...EMPTY_SNAPSHOT.dealsByStage, novo: 2 },
      }),
    )
    expect(steps.find((step) => step.key === 'abordagem')?.done).toBe(false)
  })

  it('considera a abordagem feita quando alguma negociação avançou', () => {
    const steps = journey(
      snapshotWith({
        counts: { ...EMPTY_SNAPSHOT.counts, deals: 2 },
        dealsByStage: { ...EMPTY_SNAPSHOT.dealsByStage, novo: 1, contatado: 1 },
      }),
    )
    expect(steps.find((step) => step.key === 'abordagem')?.done).toBe(true)
  })
})
