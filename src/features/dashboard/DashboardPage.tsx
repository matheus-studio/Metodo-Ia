import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MILESTONE_LABELS } from '@/app/modules'
import { CONTENT_COUNTS } from '@/app/contentCounts'
import { usePreferences } from '@/app/preferencesContext'
import { Badge, Button, EmptyState, Icon, LinkButton, Meter, Notice, Panel, SectionHeader, Stat } from '@/components/ui'
import { useSnapshot } from '@/hooks/useSnapshot'
import { DEAL_STAGES } from '@/types/domain'
import type { DealStage } from '@/types/domain'
import { journey, nextStep } from './nextStep'
import './dashboard.css'

const STAGE_LABELS: Record<DealStage, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  respondeu: 'Respondeu',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  fechado: 'Fechado',
  perdido: 'Perdido',
}

function greeting(date: Date): string {
  const hour = date.getHours()
  if (hour < 6) return 'Boa madrugada'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatMoment(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    date,
  )
}

export default function DashboardPage() {
  const { snapshot, status, error, reload } = useSnapshot()
  const { preferences } = usePreferences()
  // Fixado na montagem: ler o relógio a cada render tornaria a saudação instável.
  const [salutation] = useState(() => greeting(new Date()))

  const recommendation = useMemo(() => nextStep(snapshot, preferences), [snapshot, preferences])
  const steps = useMemo(() => journey(snapshot), [snapshot])
  const doneSteps = steps.filter((step) => step.done).length

  const dealTotal = DEAL_STAGES.reduce((total, stage) => total + snapshot.dealsByStage[stage], 0)
  const goal = preferences.weeklyGoalContacts ?? 0

  // Primeiro acesso: o painel é a porta de entrada do produto, então ele
  // precisa dizer o que existe aqui dentro antes de existir qualquer registro.
  const totalRecords =
    Object.values(snapshot.counts).reduce((total, value) => total + value, 0) + snapshot.recentActivity.length
  const firstRun = status === 'pronto' && totalRecords === 0 && !snapshot.hasDemoData

  if (status === 'erro') {
    return (
      <Panel tone="accent">
        <div className="panel-body stack">
          <h2>Não foi possível ler seus dados locais</h2>
          <p className="secondary">{error}</p>
          <p className="muted">
            Isso costuma acontecer em janelas anônimas ou quando o navegador bloqueia armazenamento para este site. Seus
            dados não foram apagados.
          </p>
          <div>
            <Button onClick={reload} icon="radar">
              Tentar novamente
            </Button>
          </div>
        </div>
      </Panel>
    )
  }

  const loading = status === 'carregando'

  return (
    <div className="dashboard">
      <header className="dashboard__intro animate-rise">
        <h1 className="dashboard__title">
          {salutation}
          {preferences.displayName ? `, ${preferences.displayName}` : ''}.
        </h1>
        {firstRun ? (
          <p className="lede">
            Você está no aplicativo completo: {CONTENT_COUNTS.servicos} serviços com escopo, prazo e plano de execução,{' '}
            {CONTENT_COUNTS.materiais} materiais na biblioteca e {CONTENT_COUNTS.aulas} aulas para consultar enquanto
            trabalha. Tudo o que você registrar fica neste aparelho, sem conta e sem nuvem.
          </p>
        ) : (
          <p className="lede">
            Da oportunidade à execução. Este painel mostra onde você está na jornada e qual é o próximo movimento com
            base no que você já registrou — não em suposições.
          </p>
        )}
      </header>

      {snapshot.hasDemoData && (
        <div className="animate-rise" style={{ '--stagger-index': 1 } as React.CSSProperties}>
          <Notice tone="warning">
            <strong>Dados de demonstração ativos.</strong> Os registros marcados como demonstração servem para você
            conhecer a interface. Eles não vieram de nenhuma fonte externa e podem ser removidos em Configurações.
          </Notice>
        </div>
      )}

      {/* ------------------------------------------------ Próximo passo */}
      <Panel tone="accent" index={2} className="next-step">
        <div className="panel-body">
          <div className="row row--between next-step__head">
            <p className="eyebrow">Próximo passo recomendado</p>
            <Badge tone="accent" dot>
              {doneSteps}/{steps.length} etapas da jornada
            </Badge>
          </div>

          <h2 className="next-step__title">{loading ? 'Lendo seus registros…' : recommendation.title}</h2>
          <p className="next-step__body">{loading ? '' : recommendation.body}</p>

          <p className="next-step__reason">
            <Icon name="info" size={14} />
            <span>{loading ? '' : recommendation.reason}</span>
          </p>

          <div className="next-step__actions">
            {recommendation.available && recommendation.module ? (
              <LinkButton to={recommendation.module.path} variant="primary" iconEnd="arrow-right">
                {recommendation.actionLabel}
              </LinkButton>
            ) : (
              <>
                <Badge tone="neutral">
                  {recommendation.module && recommendation.module.status !== 'disponivel'
                    ? MILESTONE_LABELS[recommendation.module.status]
                    : 'Em desenvolvimento'}
                </Badge>
                <LinkButton to="/roteiro" variant="secondary" iconEnd="chevron-right">
                  Ver o roteiro
                </LinkButton>
              </>
            )}
          </div>

          <ol className="journey" aria-label="Progresso da jornada">
            {steps.map((step) => (
              <li key={step.key} className={step.done ? 'journey__step is-done' : 'journey__step'}>
                <span className="journey__marker" aria-hidden="true">
                  {step.done && <Icon name="check" size={12} />}
                </span>
                <span>{step.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </Panel>

      {/* ------------------------------------------------------ Números */}
      <section aria-labelledby="titulo-indicadores" className="animate-rise" style={{ '--stagger-index': 3 } as React.CSSProperties}>
        <SectionHeader
          id="titulo-indicadores"
          title="Sua operação hoje"
          description="Contagens reais dos seus registros locais. Nada aqui é estimado pelo aplicativo."
        />
        <div className="stat-grid">
          <Stat label="Oportunidades" value={snapshot.counts.opportunities} icon="radar" />
          <Stat label="Serviços" value={snapshot.counts.blueprints} icon="blueprint" />
          <Stat label="Ofertas" value={snapshot.counts.offers} icon="offer" />
          <Stat label="Empresas" value={snapshot.counts.companies} icon="building" />
          <Stat label="Contatos" value={snapshot.counts.contacts} icon="message" />
          <Stat label="Negociações" value={dealTotal} icon="pipeline" />
          <Stat label="Projetos" value={snapshot.counts.projects} icon="project" />
          <Stat label="Tarefas abertas" value={snapshot.openTasks.length} icon="clock" />
        </div>
      </section>

      <div className="dashboard__columns">
        {/* ------------------------------------------------------- Funil */}
        <Panel index={4}>
          <div className="panel-body">
            <SectionHeader title="Funil comercial" description="Distribuição das negociações por estágio." />
            {dealTotal === 0 ? (
              <EmptyState
                icon="pipeline"
                title="Nenhuma negociação registrada"
                text="Quando você registrar o primeiro contato, o funil aparece aqui com a quantidade por estágio."
              />
            ) : (
              <ul className="funnel">
                {DEAL_STAGES.map((stage) => {
                  const value = snapshot.dealsByStage[stage]
                  return (
                    <li key={stage} className="funnel__row">
                      <span className="funnel__label">{STAGE_LABELS[stage]}</span>
                      <span className="funnel__bar" aria-hidden="true">
                        <span
                          className="funnel__fill"
                          data-stage={stage}
                          style={{ '--funnel-scale': dealTotal === 0 ? 0 : value / dealTotal } as React.CSSProperties}
                        />
                      </span>
                      <span className="funnel__value tabular">{value}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Panel>

        {/* ------------------------------------------------- Meta e foco */}
        <Panel index={5}>
          <div className="panel-body stack">
            <SectionHeader title="Ritmo da semana" description="Contatos registrados nos últimos 7 dias." />
            <Meter
              label="Contatos registrados na semana"
              value={snapshot.contactsThisWeek}
              max={goal > 0 ? goal : 1}
              leftLabel={goal > 0 ? 'Meta semanal' : 'Defina uma meta em Configurações'}
              rightLabel={goal > 0 ? `${snapshot.contactsThisWeek} / ${goal}` : `${snapshot.contactsThisWeek}`}
            />

            <hr className="hairline" />

            <h3 className="dashboard__subtitle">Tarefas abertas</h3>
            {snapshot.openTasks.length === 0 ? (
              <p className="muted dashboard__hint">
                Nenhuma tarefa aberta. As tarefas chegam aqui quando você começar a usar projetos e missões.
              </p>
            ) : (
              <ul className="task-list">
                {snapshot.openTasks.map((task) => (
                  <li key={task.id} className="task-list__item">
                    <span className="task-list__dot" aria-hidden="true" />
                    <span className="task-list__title">{task.title}</span>
                    {task.dueDate && <span className="task-list__due tabular">{task.dueDate}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>

      {/* --------------------------------------------------- Atividade */}
      <Panel index={6}>
        <div className="panel-body">
          <SectionHeader
            title="Atividade recente"
            description="Histórico das suas ações no aplicativo, guardado apenas neste dispositivo."
            action={
              <Link to="/configuracoes" className="dashboard__link">
                Gerenciar dados <Icon name="chevron-right" size={14} />
              </Link>
            }
          />
          {snapshot.recentActivity.length === 0 ? (
            <EmptyState
              icon="clock"
              title="Nada por aqui ainda"
              text="Cada ação relevante — salvar uma oportunidade, criar uma oferta, registrar um contato — aparece neste histórico."
            />
          ) : (
            <ul className="activity">
              {snapshot.recentActivity.map((entry) => (
                <li key={entry.id} className="activity__item">
                  <span className="activity__time tabular">{formatMoment(entry.createdAt)}</span>
                  <span className="activity__text">{entry.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  )
}
