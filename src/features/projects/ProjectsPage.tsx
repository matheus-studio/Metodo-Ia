import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SelectField, TextField } from '@/components/form'
import { Badge, Button, EmptyState, Icon, Meter, Notice, Panel, SectionHeader } from '@/components/ui'
import { useCollection } from '@/hooks/useCollection'
import { logActivity, repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import { newId } from '@/storage/repository'
import type { Deal, Offer, Project, ServiceBlueprint, Task } from '@/types/domain'
import { projectProgress, STATUS_LABELS } from './projectLogic'
import { tasksFromSteps } from './projectLogic'
import './projects.css'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { items: projects, status } = useCollection<Project>('projects')
  const { items: tasks } = useCollection<Task>('tasks')
  const { items: offers } = useCollection<Offer>('offers')
  const { items: deals } = useCollection<Deal>('deals')
  const { items: blueprints } = useCollection<ServiceBlueprint>('blueprints')

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [offerId, setOfferId] = useState('')

  const sorted = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [projects],
  )

  /** Negociações fechadas que ainda não viraram projeto. */
  const readyDeals = useMemo(
    () => deals.filter((deal) => deal.stage === 'fechado' && !projects.some((project) => project.dealId === deal.id)),
    [deals, projects],
  )

  async function createProject(seed?: { deal?: Deal; offer?: Offer }) {
    const offer = seed?.offer ?? offers.find((item) => item.id === (seed?.deal?.offerId ?? offerId))
    const blueprint = offer?.blueprintId ? blueprints.find((item) => item.id === offer.blueprintId) : undefined

    const projectName = seed?.deal?.title ?? name.trim() ?? offer?.name ?? ''
    if (!projectName) return

    const created = await repositories.projects.create({
      name: projectName,
      clientName: client.trim() || offer?.clientOrSegment || undefined,
      dealId: seed?.deal?.id,
      offerId: offer?.id,
      blueprintId: blueprint?.id,
      status: 'briefing',
      briefing: [],
      // Entregáveis vêm da oferta aceita: é o que foi combinado, não o que eu acho.
      deliverables: (offer?.deliverables ?? []).map((title) => ({ id: newId(), title, done: false })),
    })

    if (blueprint) {
      for (const step of tasksFromSteps(blueprint.steps)) {
        await repositories.tasks.create({ title: step, projectId: created.id, done: false })
      }
    }

    await logActivity({ kind: 'projeto-atualizado', message: `Projeto aberto: ${created.name}.`, refId: created.id })
    dataBus.emit()
    navigate(`/projetos/${created.id}`)
  }

  return (
    <div className="projects">
      <header className="page-intro">
        <h1>Da venda fechada à entrega aprovada</h1>
        <p className="lede">
          Briefing, planejamento, execução, revisão e entrega. O progresso vem do que você marcou como feito — não do
          estágio em que o projeto está.
        </p>
        <div className="row">
          <Button icon="plus" onClick={() => setCreating((value) => !value)}>
            Novo projeto
          </Button>
        </div>
      </header>

      {creating && (
        <Panel>
          <div className="panel-body stack">
            <SectionHeader title="Abrir projeto" />
            <TextField label="Nome do projeto" required value={name} onChange={setName} placeholder="Ex.: Cantina do Bairro — site" />
            <TextField label="Cliente" value={client} onChange={setClient} />
            <SelectField
              label="Oferta aceita (opcional)"
              value={offerId}
              onChange={setOfferId}
              options={[
                { value: '', label: offers.length > 0 ? 'Sem oferta vinculada' : 'Nenhuma oferta criada' },
                ...offers.map((item) => ({ value: item.id, label: item.name })),
              ]}
              hint="Vincular a oferta traz os entregáveis combinados e, pelo serviço, as etapas como tarefas."
            />
            <div className="row">
              <Button icon="check" onClick={() => void createProject()}>
                Criar projeto
              </Button>
              <Button variant="ghost" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {readyDeals.length > 0 && (
        <Panel tone="accent">
          <div className="panel-body stack">
            <SectionHeader
              title="Negociações fechadas sem projeto"
              description="Venda fechada que não virou projeto é entrega sem dono."
            />
            <ul className="services__suggestions">
              {readyDeals.map((deal) => (
                <li key={deal.id}>
                  <button type="button" className="services__suggestion" onClick={() => void createProject({ deal })}>
                    <Icon name="project" size={16} />
                    <span>{deal.title}</span>
                    <Icon name="chevron-right" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      )}

      {status === 'pronto' && sorted.length === 0 ? (
        <Panel>
          <EmptyState
            icon="project"
            title="Nenhum projeto aberto"
            text="Quando uma negociação for fechada, abra o projeto aqui para controlar briefing, tarefas e aprovação."
          />
        </Panel>
      ) : (
        <ul className="projects__grid">
          {sorted.map((project, index) => {
            const progress = projectProgress(project, tasks)
            return (
              <li
                key={project.id}
                className="project-card animate-rise"
                style={{ '--stagger-index': Math.min(index, 8) } as React.CSSProperties}
              >
                <div className="row row--between">
                  <Badge tone={project.status === 'entregue' ? 'success' : 'data'} dot>
                    {STATUS_LABELS[project.status]}
                  </Badge>
                  <span className="muted tabular">{progress.percent}%</span>
                </div>
                <h3 className="service-card__title">
                  <Link to={`/projetos/${project.id}`}>{project.name}</Link>
                </h3>
                <p className="service-card__meta">{project.clientName ?? 'Cliente não informado'}</p>
                <Meter label={`Progresso de ${project.name}`} value={progress.percent} max={100} />
                <p className="service-card__meta">
                  {progress.tasksDone}/{progress.tasksTotal} tarefas · {progress.deliverablesDone}/
                  {progress.deliverablesTotal} entregáveis
                </p>
                <div className="service-card__actions">
                  <Link to={`/projetos/${project.id}`} className="catalog-card__link">
                    Abrir <Icon name="chevron-right" size={14} />
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Notice>
        O progresso conta tarefas e entregáveis concluídos. Mover o estágio não move a barra — e é de propósito: o
        estágio diz onde você acha que está, a barra diz o que está feito.
      </Notice>
    </div>
  )
}
