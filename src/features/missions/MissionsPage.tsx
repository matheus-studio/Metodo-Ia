import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { moduleByKey } from '@/app/modules'
import { TextField } from '@/components/form'
import { Badge, Button, EmptyState, Icon, LinkButton, Meter, Notice, Panel, SectionHeader } from '@/components/ui'
import { useCollection } from '@/hooks/useCollection'
import { logActivity, repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import type { ActivityEntry, Task } from '@/types/domain'
import { summarizeWeek, weeklyMissions, weekRange } from './missionsLogic'
import './missions.css'

export default function MissionsPage() {
  const { items: activity } = useCollection<ActivityEntry>('activity')
  const { items: tasks } = useCollection<Task>('tasks')
  const [draft, setDraft] = useState('')
  const [due, setDue] = useState('')

  const range = useMemo(() => weekRange(), [])
  const missions = useMemo(() => weeklyMissions(activity), [activity])
  const summary = useMemo(() => summarizeWeek(missions), [missions])

  // Tarefas soltas (sem projeto) são o planejamento pessoal da semana.
  const personal = tasks.filter((task) => task.projectId === undefined)

  async function addTask() {
    const title = draft.trim()
    if (!title) return
    await repositories.tasks.create({ title, done: false, dueDate: due || undefined })
    setDraft('')
    setDue('')
    dataBus.emit()
  }

  async function toggle(task: Task) {
    await repositories.tasks.update(task.id, { done: !task.done })
    if (!task.done) {
      await logActivity({ kind: 'tarefa-concluida', message: `Tarefa concluída: ${task.title}.`, refId: task.id })
    }
    dataBus.emit()
  }

  return (
    <div className="missions">
      <header className="page-intro">
        <h1>Ritmo da semana</h1>
        <p className="lede">
          O progresso vem do que você registrou de verdade no aplicativo, não de pontos. O que costuma faltar em quem
          está começando não é motivação — é constância em quatro ou cinco ações simples.
        </p>
      </header>

      <Panel tone="accent">
        <div className="panel-body stack">
          <div className="row row--between">
            <p className="eyebrow">Semana de {range.label}</p>
            <Badge tone={summary.completed === summary.total ? 'success' : 'neutral'} dot>
              {summary.completed}/{summary.total} missões
            </Badge>
          </div>
          <Meter
            label="Missões concluídas na semana"
            value={summary.percent}
            max={100}
            leftLabel={summary.focus ? `Comece por: ${summary.focus.label}` : 'Semana completa'}
            rightLabel={`${summary.percent}%`}
          />
          {summary.focus && (
            <div className="row">
              {(() => {
                const module = moduleByKey(summary.focus.moduleKey)
                return module?.status === 'disponivel' ? (
                  <LinkButton to={module.path} icon={module.icon}>
                    {summary.focus.label}
                  </LinkButton>
                ) : null
              })()}
            </div>
          )}
        </div>
      </Panel>

      <ul className="missions__grid">
        {missions.map((mission, index) => {
          const module = moduleByKey(mission.moduleKey)
          return (
            <li
              key={mission.key}
              className={mission.done ? 'mission-card is-done animate-rise' : 'mission-card animate-rise'}
              style={{ '--stagger-index': Math.min(index, 8) } as React.CSSProperties}
            >
              <div className="row row--between">
                <h3 className="mission-card__title">{mission.label}</h3>
                {mission.done ? (
                  <Badge tone="success" dot>
                    Feito
                  </Badge>
                ) : (
                  <span className="muted tabular">
                    {mission.progress}/{mission.target}
                  </span>
                )}
              </div>
              <p className="catalog-card__summary">{mission.description}</p>
              <Meter
                label={`Progresso de ${mission.label}`}
                value={Math.min(mission.progress, mission.target)}
                max={mission.target}
              />
              {/* Link do roteador: <a href> recarregaria o aplicativo inteiro. */}
              {module?.status === 'disponivel' && (
                <Link className="catalog-card__link" to={module.path}>
                  Ir para {module.label} <Icon name="chevron-right" size={14} />
                </Link>
              )}
            </li>
          )
        })}
      </ul>

      <Panel>
        <div className="panel-body stack">
          <SectionHeader
            title="Planejamento da semana"
            description="Tarefas suas, sem projeto vinculado. As de projeto ficam dentro de cada projeto."
          />
          <div className="project-task-form">
            <TextField label="Nova tarefa" value={draft} onChange={setDraft} placeholder="Ex.: visitar 3 comércios da rua" />
            <TextField label="Prazo" type="date" value={due} onChange={setDue} />
            <Button icon="plus" onClick={() => void addTask()}>
              Adicionar
            </Button>
          </div>

          {personal.length === 0 ? (
            <EmptyState icon="target" title="Nenhuma tarefa pessoal" text="Anote aqui o que você quer fazer nesta semana." />
          ) : (
            <ul className="checklist">
              {personal.map((task) => (
                <li key={task.id} className={task.done ? 'checklist__item is-done' : 'checklist__item'}>
                  <button
                    type="button"
                    className="checklist__check"
                    role="checkbox"
                    aria-checked={task.done}
                    aria-label={`Marcar "${task.title}" como ${task.done ? 'pendente' : 'concluída'}`}
                    onClick={() => void toggle(task)}
                  >
                    {task.done && <Icon name="check" size={13} />}
                  </button>
                  <span className="checklist__title">{task.title}</span>
                  {task.dueDate && <span className="checklist__due tabular">{task.dueDate}</span>}
                  <button
                    type="button"
                    className="icon-button icon-button--sm"
                    aria-label={`Excluir tarefa ${task.title}`}
                    onClick={() => {
                      void (async () => {
                        await repositories.tasks.remove(task.id)
                        dataBus.emit()
                      })()
                    }}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Notice>
        As metas desta tela são iguais para todo mundo e servem de referência de ritmo — não são promessa de resultado.
        Quantas abordagens viram clientes depende do seu mercado, da sua oferta e do seu preço.
      </Notice>
    </div>
  )
}
