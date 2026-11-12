import { useEffect, useId, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SelectField, TextField } from '@/components/form'
import { Badge, Button, Icon, Meter, Notice, Panel, SectionHeader } from '@/components/ui'
import { HelpTerm } from '@/components/HelpTerm'
import { useCollection } from '@/hooks/useCollection'
import { logActivity, repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import { newId } from '@/storage/repository'
import type { Project, ProjectStatus, Task } from '@/types/domain'
import { BRIEFING_TEMPLATES, briefingTemplate } from './briefingTemplates'
import {
  canAdvance,
  nextProjectStatus,
  projectAdvice,
  projectProgress,
  PROJECT_STAGES,
  STATUS_HELP,
  STATUS_LABELS,
} from './projectLogic'
import './projects.css'

export default function ProjectEditorPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { items: allTasks } = useCollection<Task>('tasks')

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  /**
   * Texto em edição fica em memória e só é gravado ao sair do campo. Gravar a
   * cada tecla dispararia escritas concorrentes no banco e a última a terminar
   * venceria — perdendo parte do que foi digitado.
   */
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [taskDraft, setTaskDraft] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [deliverableDraft, setDeliverableDraft] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    let alive = true
    void (async () => {
      const record = await repositories.projects.get(id)
      if (!alive) return
      setProject(record ?? null)
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [id])

  const tasks = useMemo(() => allTasks.filter((task) => task.projectId === id), [allTasks, id])
  const progress = useMemo(() => (project ? projectProgress(project, allTasks) : null), [project, allTasks])
  const advice = useMemo(() => (project ? projectAdvice(project, allTasks) : []), [project, allTasks])

  async function patch(changes: Partial<Omit<Project, 'id' | 'createdAt'>>) {
    if (!project) return
    const updated = await repositories.projects.update(project.id, changes)
    setProject(updated)
    dataBus.emit()
  }

  async function changeStatus(status: ProjectStatus) {
    if (!project) return
    await patch({ status })
    await logActivity({
      kind: 'projeto-atualizado',
      message: `${project.name}: ${STATUS_LABELS[project.status]} → ${STATUS_LABELS[status]}.`,
      refId: project.id,
    })
  }

  function applyTemplate(key: string) {
    const template = briefingTemplate(key)
    if (!template || !project) return
    // Respostas já escritas são preservadas quando a pergunta continua existindo.
    const previous = new Map(project.briefing.map((item) => [item.question, item.answer]))
    void patch({
      briefingTemplate: key,
      briefing: template.questions.map((question) => ({ question, answer: previous.get(question) ?? '' })),
    })
  }

  async function addTask() {
    const title = taskDraft.trim()
    if (!title || !project) return
    await repositories.tasks.create({
      title,
      projectId: project.id,
      done: false,
      dueDate: taskDue || undefined,
    })
    setTaskDraft('')
    setTaskDue('')
    dataBus.emit()
  }

  async function toggleTask(task: Task) {
    await repositories.tasks.update(task.id, { done: !task.done })
    if (!task.done) {
      await logActivity({ kind: 'tarefa-concluida', message: `Tarefa concluída: ${task.title}.`, refId: task.id })
    }
    dataBus.emit()
  }

  async function removeTask(task: Task) {
    await repositories.tasks.remove(task.id)
    dataBus.emit()
  }

  function addDeliverable() {
    const title = deliverableDraft.trim()
    if (!title || !project) return
    void patch({ deliverables: [...project.deliverables, { id: newId(), title, done: false }] })
    setDeliverableDraft('')
  }

  if (loading) {
    return (
      <Panel>
        <div className="panel-body">
          <p className="muted">Carregando projeto…</p>
        </div>
      </Panel>
    )
  }

  if (!project || !progress) {
    return (
      <Panel tone="accent">
        <div className="panel-body stack">
          <h1>Projeto não encontrado</h1>
          <p className="secondary">Ele pode ter sido excluído neste dispositivo.</p>
          <div className="row">
            <Button icon="project" onClick={() => navigate('/projetos')}>
              Voltar aos projetos
            </Button>
          </div>
        </div>
      </Panel>
    )
  }

  const template = briefingTemplate(project.briefingTemplate)
  const advance = nextProjectStatus(project.status)
  const allowed = canAdvance(project, allTasks)

  return (
    <div className="project-editor">
      <Link to="/projetos" className="back-link">
        <Icon name="chevron-right" size={14} />
        Voltar aos projetos
      </Link>

      <header className="page-intro">
        <p className="eyebrow">Projeto</p>
        <h1>{project.name}</h1>
        <p className="muted">{project.clientName ?? 'Cliente não informado'}</p>
      </header>

      <Panel tone="accent">
        <div className="panel-body stack">
          <div className="row row--between">
            <p className="eyebrow">Estágio</p>
            <Badge tone={project.status === 'entregue' ? 'success' : 'data'} dot>
              {STATUS_LABELS[project.status]}
            </Badge>
          </div>

          <div className="project-stages">
            {PROJECT_STAGES.map((stage) => (
              <button
                key={stage}
                type="button"
                className={stage === project.status ? 'stage-pill is-current' : 'stage-pill'}
                aria-pressed={stage === project.status}
                aria-label={`Mover projeto para ${STATUS_LABELS[stage]}`}
                onClick={() => void changeStatus(stage)}
              >
                {STATUS_LABELS[stage]}
              </button>
            ))}
          </div>

          <p className="muted">{STATUS_HELP[project.status]}</p>

          <Meter
            label="Progresso do projeto"
            value={progress.percent}
            max={100}
            leftLabel={`${progress.tasksDone}/${progress.tasksTotal} tarefas · ${progress.deliverablesDone}/${progress.deliverablesTotal} entregáveis`}
            rightLabel={`${progress.percent}%`}
          />

          {advice.length > 0 && (
            <Notice tone="warning">
              <ul className="bullets">
                {advice.map((item) => (
                  <li key={item.message}>{item.message}</li>
                ))}
              </ul>
            </Notice>
          )}

          {advance && (
            <div className="row">
              <Button icon="arrow-right" disabled={!allowed} onClick={() => void changeStatus(advance)}>
                Avançar para {STATUS_LABELS[advance]}
              </Button>
              {!allowed && <span className="muted">Resolva o ponto acima antes de avançar.</span>}
            </div>
          )}
        </div>
      </Panel>

      {/* ------------------------------------------------------- Briefing */}
      <Panel>
        <div className="panel-body stack">
          <SectionHeader
            title="Briefing"
            description="As perguntas existem para evitar retrabalho conhecido. Resposta vaga agora é ajuste não pago depois."
          />
          <p className="secondary">
            Primeira vez? Veja o que é <HelpTerm termKey="briefing" label="um briefing" /> e o que conta como{' '}
            <HelpTerm termKey="entregavel" label="entregável" />.
          </p>
          <SelectField
            label="Modelo"
            value={project.briefingTemplate ?? ''}
            onChange={applyTemplate}
            options={[
              { value: '', label: 'Escolher modelo de briefing' },
              ...BRIEFING_TEMPLATES.map((item) => ({ value: item.key, label: item.label })),
            ]}
            hint={template?.description}
          />

          {project.briefing.length > 0 && (
            <div className="stack">
              {project.briefing.map((item, index) => (
                <AutoSaveTextArea
                  key={item.question}
                  label={item.question}
                  value={drafts[item.question] ?? item.answer}
                  onDraft={(answer) => setDrafts((current) => ({ ...current, [item.question]: answer }))}
                  onCommit={(answer) => {
                    if (answer === item.answer) return
                    const briefing = project.briefing.map((entry, position) =>
                      position === index ? { ...entry, answer } : entry,
                    )
                    void patch({ briefing })
                  }}
                />
              ))}
              <p className="muted">
                {progress.briefingAnswered} de {progress.briefingTotal} respondidas.
              </p>
            </div>
          )}
        </div>
      </Panel>

      {/* -------------------------------------------------------- Tarefas */}
      <Panel>
        <div className="panel-body stack">
          <SectionHeader title="Tarefas" description="Quebre a execução no tamanho em que ela cabe no seu dia." />
          <div className="project-task-form">
            <TextField label="Nova tarefa" value={taskDraft} onChange={setTaskDraft} placeholder="Ex.: montar a página inicial" />
            <TextField label="Prazo" type="date" value={taskDue} onChange={setTaskDue} />
            <Button icon="plus" onClick={() => void addTask()}>
              Adicionar
            </Button>
          </div>

          {tasks.length === 0 ? (
            <p className="muted">Nenhuma tarefa. Se o projeto veio de um serviço estruturado, as etapas já viriam aqui.</p>
          ) : (
            <ul className="checklist">
              {tasks.map((task) => (
                <li key={task.id} className={task.done ? 'checklist__item is-done' : 'checklist__item'}>
                  <button
                    type="button"
                    className="checklist__check"
                    role="checkbox"
                    aria-checked={task.done}
                    aria-label={`Marcar "${task.title}" como ${task.done ? 'pendente' : 'concluída'}`}
                    onClick={() => void toggleTask(task)}
                  >
                    {task.done && <Icon name="check" size={13} />}
                  </button>
                  <span className="checklist__title">{task.title}</span>
                  {task.dueDate && <span className="checklist__due tabular">{task.dueDate}</span>}
                  <button
                    type="button"
                    className="icon-button icon-button--sm"
                    aria-label={`Excluir tarefa ${task.title}`}
                    onClick={() => void removeTask(task)}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      {/* ---------------------------------------------------- Entregáveis */}
      <Panel>
        <div className="panel-body stack">
          <SectionHeader
            title="Entregáveis e aprovação"
            description="Aprovação registrada aqui é a sua anotação de que o cliente aprovou — não é assinatura digital."
          />
          <div className="project-task-form">
            <TextField
              label="Novo entregável"
              value={deliverableDraft}
              onChange={setDeliverableDraft}
              placeholder="Ex.: página publicada"
            />
            <Button icon="plus" onClick={addDeliverable}>
              Adicionar
            </Button>
          </div>

          {project.deliverables.length === 0 ? (
            <p className="muted">Nenhum entregável listado. Vindo de uma oferta, eles entram automaticamente.</p>
          ) : (
            <ul className="checklist">
              {project.deliverables.map((item) => (
                <li key={item.id} className={item.done ? 'checklist__item is-done' : 'checklist__item'}>
                  <button
                    type="button"
                    className="checklist__check"
                    role="checkbox"
                    aria-checked={item.done}
                    aria-label={`Marcar "${item.title}" como ${item.done ? 'pendente' : 'pronto'}`}
                    onClick={() =>
                      void patch({
                        deliverables: project.deliverables.map((entry) =>
                          entry.id === item.id ? { ...entry, done: !entry.done } : entry,
                        ),
                      })
                    }
                  >
                    {item.done && <Icon name="check" size={13} />}
                  </button>
                  <span className="checklist__title">{item.title}</span>
                  {item.approvedAt ? (
                    <Badge tone="success">Aprovado</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void patch({
                          deliverables: project.deliverables.map((entry) =>
                            entry.id === item.id ? { ...entry, approvedAt: new Date().toISOString() } : entry,
                          ),
                        })
                      }
                    >
                      Registrar aprovação
                    </Button>
                  )}
                  <button
                    type="button"
                    className="icon-button icon-button--sm"
                    aria-label={`Excluir entregável ${item.title}`}
                    onClick={() =>
                      void patch({ deliverables: project.deliverables.filter((entry) => entry.id !== item.id) })
                    }
                  >
                    <Icon name="close" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Panel>
        <div className="panel-body stack">
          <SectionHeader title="Notas do projeto" />
          <AutoSaveTextArea
            label="Anotações"
            rows={4}
            value={drafts.__notes ?? project.notes ?? ''}
            onDraft={(notes) => setDrafts((current) => ({ ...current, __notes: notes }))}
            onCommit={(notes) => {
              if (notes !== (project.notes ?? '')) void patch({ notes })
            }}
            hint="Combinados, decisões e o que foi dito em reunião. Memória escrita evita discussão depois."
          />
        </div>
      </Panel>

      <div className="editor-actions">
        {confirmingDelete ? (
          <>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                void (async () => {
                  for (const task of tasks) await repositories.tasks.remove(task.id)
                  await repositories.projects.remove(project.id)
                  dataBus.emit()
                  navigate('/projetos')
                })()
              }}
            >
              Confirmar exclusão do projeto e suas tarefas
            </Button>
            <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button variant="ghost" icon="trash" onClick={() => setConfirmingDelete(true)}>
            Excluir projeto
          </Button>
        )}
      </div>
    </div>
  )
}

/** Campo de texto que guarda o valor em memória e grava ao perder o foco. */
function AutoSaveTextArea({
  label,
  value,
  rows = 2,
  hint,
  onDraft,
  onCommit,
}: {
  label: string
  value: string
  rows?: number
  hint?: string
  onDraft: (value: string) => void
  onCommit: (value: string) => void
}) {
  const id = useId()
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className="field__input field__input--area"
        rows={rows}
        maxLength={4000}
        value={value}
        onChange={(event) => onDraft(event.target.value)}
        onBlur={(event) => onCommit(event.target.value)}
      />
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  )
}
