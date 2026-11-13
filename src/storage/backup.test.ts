import { describe, expect, it } from 'vitest'
import { repositories } from '@/repositories'
import {
  BackupRestoreError,
  BackupValidationError,
  clearAllData,
  exportBackup,
  importBackup,
  parseBackup,
} from './backup'

async function seed() {
  await repositories.companies.create({
    name: 'Empresa A',
    segment: 'Alimentação',
    city: 'Curitiba',
    digitalPresence: 'site-nao-cadastrado',
    source: 'manual',
  })
  await repositories.offers.create({
    name: 'Oferta A',
    clientOrSegment: 'Restaurantes',
    deliverables: ['Site'],
    clientResponsibilities: [],
    differentials: [],
    nextSteps: [],
    currency: 'BRL',
    status: 'rascunho',
  })
}

describe('backup', () => {
  it('exporta todas as coleções com envelope reconhecível', async () => {
    await seed()
    const backup = await exportBackup()
    expect(backup.format).toBe('metodo-ia-pro/backup')
    expect(backup.collections.companies).toHaveLength(1)
    expect(backup.collections.offers).toHaveLength(1)
  })

  it('faz a volta completa: exportar, apagar e restaurar', async () => {
    await seed()
    const raw = JSON.stringify(await exportBackup())
    await clearAllData()
    expect(await repositories.companies.count()).toBe(0)

    const summary = await importBackup(parseBackup(raw))
    expect(summary.imported).toBe(2)
    expect(summary.atomic).toBe(true)
    expect(await repositories.companies.count()).toBe(1)
  })

  it('recusa arquivo que não é um backup do aplicativo', () => {
    expect(() => parseBackup(JSON.stringify({ format: 'outra-coisa' }))).toThrow(BackupValidationError)
  })

  it('recusa JSON inválido', () => {
    expect(() => parseBackup('{isto não é json')).toThrow(BackupValidationError)
  })

  it('recusa backup de versão futura', () => {
    expect(() =>
      parseBackup(JSON.stringify({ format: 'metodo-ia-pro/backup', version: 99, collections: {} })),
    ).toThrow(BackupValidationError)
  })

  // Mudança deliberada de comportamento: antes os registros quebrados eram
  // descartados em silêncio. Importar "o que deu" deixa o usuário com um estado
  // que ele não consegue auditar.
  it('recusa o arquivo inteiro quando há registro malformado, sem gravar nada', async () => {
    await seed()
    const antes = await repositories.companies.count()

    expect(() =>
      parseBackup(
        JSON.stringify({
          format: 'metodo-ia-pro/backup',
          version: 1,
          collections: { companies: [{ id: 'ok', name: 'Empresa' }, { semId: true }] },
        }),
      ),
    ).toThrow(BackupValidationError)

    expect(await repositories.companies.count()).toBe(antes)
  })

  it('aponta no erro quantos registros têm problema', () => {
    try {
      parseBackup(
        JSON.stringify({
          format: 'metodo-ia-pro/backup',
          version: 1,
          collections: { contacts: [{ id: 'a' }, { id: 'b', name: 42 }] },
        }),
      )
      expect.unreachable('deveria ter recusado')
    } catch (error) {
      expect(error).toBeInstanceOf(BackupValidationError)
      expect((error as BackupValidationError).issues).toHaveLength(2)
      expect((error as Error).message).toContain('Nada foi alterado')
    }
  })

  it('valida a estrutura específica de cada coleção', () => {
    const comEstagioInvalido = JSON.stringify({
      format: 'metodo-ia-pro/backup',
      version: 1,
      collections: { deals: [{ id: 'd1', title: 'Negócio', stage: 'estágio-que-não-existe' }] },
    })
    expect(() => parseBackup(comEstagioInvalido)).toThrow(/stage/)
  })

  it('recusa ids repetidos dentro da mesma coleção', () => {
    const duplicado = JSON.stringify({
      format: 'metodo-ia-pro/backup',
      version: 1,
      collections: {
        tasks: [
          { id: 't1', title: 'A', done: false },
          { id: 't1', title: 'B', done: false },
        ],
      },
    })
    expect(() => parseBackup(duplicado)).toThrow(/repetido/)
  })

  it('ignora coleção desconhecida, mas exige que o arquivo tenha alguma conhecida', () => {
    const file = parseBackup(
      JSON.stringify({
        format: 'metodo-ia-pro/backup',
        version: 1,
        collections: { coleçãoInventada: [{ id: 'x' }], tasks: [{ id: 't1', title: 'A', done: false }] },
      }),
    )
    expect(Object.keys(file.collections)).toEqual(['tasks'])

    expect(() =>
      parseBackup(JSON.stringify({ format: 'metodo-ia-pro/backup', version: 1, collections: { nada: [] } })),
    ).toThrow(/nenhuma coleção reconhecida/)
  })

  // Regressão do problema apontado na auditoria: o modo "substituir" limpava as
  // coleções e gravava registro a registro, então uma falha no meio deixava o
  // usuário com os dados antigos apagados e os novos pela metade.
  it('em caso de falha no meio da restauração, não altera nada (modo substituir)', async () => {
    await seed()
    const antes = await repositories.companies.list()
    expect(antes).toHaveLength(1)

    const arquivoQueFalha = {
      format: 'metodo-ia-pro/backup' as const,
      version: 1,
      exportedAt: new Date().toISOString(),
      collections: {
        // O segundo registro não é clonável pelo IndexedDB: a gravação falha no
        // meio da transação, que então é abortada inteira.
        companies: [
          { ...antes[0]!, id: 'nova-1', name: 'Empresa restaurada' },
          { ...antes[0]!, id: 'nova-2', naoClonavel: () => 'quebra' } as unknown as (typeof antes)[number],
        ],
      },
    }

    await expect(importBackup(arquivoQueFalha, 'replace')).rejects.toBeInstanceOf(BackupRestoreError)

    const depois = await repositories.companies.list()
    expect(depois).toHaveLength(1)
    expect(depois[0]?.id).toBe(antes[0]?.id)
  })

  it('no modo mesclar preserva o que já existe no dispositivo', async () => {
    await seed()
    const raw = JSON.stringify(await exportBackup())
    await repositories.companies.create({
      name: 'Empresa local',
      segment: 'Serviços',
      city: 'Joinville',
      digitalPresence: 'site-nao-confirmado',
      source: 'manual',
    })
    await importBackup(parseBackup(raw), 'merge')
    expect(await repositories.companies.count()).toBe(2)
  })

  it('no modo substituir troca o conteúdo das coleções presentes no arquivo', async () => {
    await seed()
    const raw = JSON.stringify(await exportBackup())
    await repositories.companies.create({
      name: 'Empresa que deve sumir',
      segment: 'Serviços',
      city: 'Joinville',
      digitalPresence: 'site-nao-confirmado',
      source: 'manual',
    })
    await importBackup(parseBackup(raw), 'replace')
    const rows = await repositories.companies.list()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.name).toBe('Empresa A')
  })
})

describe('plano de 7 dias no backup', () => {
  it('vai junto no backup e volta na restauração', async () => {
    const { writePlan, readPlan } = await import('@/features/plan/planStore')
    writePlan({ serviceKey: 'site-institucional', city: 'Curitiba', dailyGoal: 5, startedOn: '2026-11-13', log: {} })
    const file = await exportBackup()
    expect(file.plan?.city).toBe('Curitiba')

    writePlan(null)
    const parsed = parseBackup(JSON.stringify(file))
    await importBackup(parsed, 'replace')
    expect(readPlan()?.serviceKey).toBe('site-institucional')
  })

  it('ignora plano malformado em vez de recusar o backup', async () => {
    const { exportBackup: exportNow } = await import('./backup')
    const file = await exportNow()
    const parsed = parseBackup(JSON.stringify({ ...file, plan: { serviceKey: 42 } }))
    expect(parsed.plan).toBeUndefined()
  })
})
