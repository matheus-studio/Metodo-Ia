import type { Project, ProjectStatus, Task } from '@/types/domain'

export const PROJECT_STAGES: ProjectStatus[] = ['briefing', 'planejamento', 'execucao', 'revisao', 'entregue']

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  briefing: 'Briefing',
  planejamento: 'Planejamento',
  execucao: 'Execução',
  revisao: 'Revisão',
  entregue: 'Entregue',
}

export const STATUS_HELP: Record<ProjectStatus, string> = {
  briefing: 'Coletando informação e material com o cliente.',
  planejamento: 'Escopo entendido; tarefas e prazos sendo definidos.',
  execucao: 'Trabalho em andamento.',
  revisao: 'Entrega apresentada, ajustes em curso.',
  entregue: 'Aprovado e encerrado.',
}

export function nextProjectStatus(status: ProjectStatus): ProjectStatus | null {
  const index = PROJECT_STAGES.indexOf(status)
  if (index === -1 || index === PROJECT_STAGES.length - 1) return null
  return PROJECT_STAGES[index + 1] ?? null
}

export interface ProjectProgress {
  /** 0 a 100, com base em tarefas e entregáveis concluídos. */
  percent: number
  tasksDone: number
  tasksTotal: number
  deliverablesDone: number
  deliverablesTotal: number
  approvedDeliverables: number
  briefingAnswered: number
  briefingTotal: number
}

/**
 * Progresso vem do que foi marcado como feito — tarefas e entregáveis — e não
 * do estágio. Projeto movido para "execução" sem nenhuma tarefa concluída
 * continua em 0%, que é a verdade.
 */
export function projectProgress(project: Project, tasks: Task[]): ProjectProgress {
  const projectTasks = tasks.filter((task) => task.projectId === project.id)
  const tasksDone = projectTasks.filter((task) => task.done).length
  const deliverablesDone = project.deliverables.filter((item) => item.done).length
  const approved = project.deliverables.filter((item) => item.approvedAt !== undefined).length
  const briefingAnswered = project.briefing.filter((item) => item.answer.trim() !== '').length

  const total = projectTasks.length + project.deliverables.length
  const done = tasksDone + deliverablesDone

  return {
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    tasksDone,
    tasksTotal: projectTasks.length,
    deliverablesDone,
    deliverablesTotal: project.deliverables.length,
    approvedDeliverables: approved,
    briefingAnswered,
    briefingTotal: project.briefing.length,
  }
}

export interface ProjectAdvice {
  message: string
  /** Impede avançar de estágio quando algo essencial ficou para trás. */
  blocking: boolean
}

/** O que falta para o projeto avançar — sempre com o motivo explícito. */
export function projectAdvice(project: Project, tasks: Task[]): ProjectAdvice[] {
  const progress = projectProgress(project, tasks)
  const advice: ProjectAdvice[] = []

  if (project.status === 'briefing') {
    if (progress.briefingTotal === 0) {
      advice.push({ message: 'Escolha um modelo de briefing e registre as respostas do cliente.', blocking: true })
    } else if (progress.briefingAnswered < progress.briefingTotal) {
      advice.push({
        message: `${progress.briefingTotal - progress.briefingAnswered} pergunta(s) do briefing sem resposta. Começar sem elas é onde nasce o retrabalho.`,
        blocking: false,
      })
    }
  }

  if (project.status === 'planejamento' && progress.tasksTotal === 0) {
    advice.push({ message: 'Nenhuma tarefa cadastrada. Quebre a execução em passos antes de começar.', blocking: true })
  }

  if (project.status === 'execucao' && progress.deliverablesTotal === 0) {
    advice.push({
      message: 'Sem entregáveis listados, não há o que o cliente aprove no fim.',
      blocking: false,
    })
  }

  if (project.status === 'revisao' && progress.tasksDone < progress.tasksTotal) {
    advice.push({
      message: `${progress.tasksTotal - progress.tasksDone} tarefa(s) ainda abertas enquanto o projeto está em revisão.`,
      blocking: false,
    })
  }

  if (project.status === 'revisao' && progress.deliverablesTotal > 0) {
    const pending = progress.deliverablesTotal - progress.approvedDeliverables
    if (pending > 0) {
      advice.push({
        message: `${pending} entregável(is) sem aprovação registrada. Registre a aprovação antes de dar o projeto por entregue.`,
        blocking: true,
      })
    }
  }

  return advice
}

export function canAdvance(project: Project, tasks: Task[]): boolean {
  if (nextProjectStatus(project.status) === null) return false
  return !projectAdvice(project, tasks).some((item) => item.blocking)
}

/** Converte as etapas de um serviço estruturado em tarefas do projeto. */
export function tasksFromSteps(steps: string[]): string[] {
  return steps.map((step) => step.trim()).filter((step) => step.length > 0)
}
