import { describe, expect, it } from 'vitest'
import { repositories } from '@/repositories'
import { RecordNotFoundError } from './types'
import { createMemoryRepository } from './repository'
import type { CompanyLead } from '@/types/domain'

describe('repositório (IndexedDB)', () => {
  it('cria, lê, atualiza e remove preservando createdAt', async () => {
    const created = await repositories.companies.create({
      name: 'Empresa de teste',
      segment: 'Serviços',
      city: 'Curitiba',
      digitalPresence: 'site-nao-confirmado',
      source: 'manual',
    })

    expect(created.id).toBeTruthy()
    expect(await repositories.companies.count()).toBe(1)

    const updated = await repositories.companies.update(created.id, { city: 'São Paulo' })
    expect(updated.city).toBe('São Paulo')
    expect(updated.createdAt).toBe(created.createdAt)

    await repositories.companies.remove(created.id)
    expect(await repositories.companies.get(created.id)).toBeUndefined()
  })

  it('rejeita atualização de registro inexistente', async () => {
    await expect(repositories.companies.update('não-existe', { city: 'X' })).rejects.toBeInstanceOf(RecordNotFoundError)
  })

  it('put mantém o createdAt original ao regravar o mesmo id', async () => {
    const created = await repositories.companies.create({
      name: 'Empresa',
      segment: 'Serviços',
      city: 'Curitiba',
      digitalPresence: 'site-nao-cadastrado',
      source: 'manual',
    })
    const regravado = await repositories.companies.put({ ...created, name: 'Empresa renomeada' })
    expect(regravado.createdAt).toBe(created.createdAt)
    expect(regravado.name).toBe('Empresa renomeada')
  })
})

describe('repositório em memória (fallback)', () => {
  it('oferece o mesmo contrato da implementação persistente', async () => {
    const repo = createMemoryRepository<CompanyLead>('companies')
    const created = await repo.create({
      name: 'Fallback',
      segment: 'Serviços',
      city: 'Curitiba',
      digitalPresence: 'site-nao-confirmado',
      source: 'manual',
    })
    expect(await repo.list()).toHaveLength(1)
    await repo.clear()
    expect(await repo.get(created.id)).toBeUndefined()
  })
})
