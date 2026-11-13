import { useMemo, useState } from 'react'
import { CONTENT_COUNTS } from '@/app/contentCounts'
import { usePreferences } from '@/app/preferencesContext'
import { Badge, Button, Icon, LinkButton, Meter, Notice, Panel, SectionHeader, Stat } from '@/components/ui'
import { SelectField, TextField } from '@/components/form'
import { CATALOG } from '@/features/catalog/catalogData'
import { buildMessage } from '@/features/prospecting/messageTemplates'
import { countPipeline } from '@/features/clients/clientsLogic'
import { useCollection } from '@/hooks/useCollection'
import { useNow } from '@/hooks/useNow'
import { InstallBanner } from '@/pwa/InstallCard'
import { CATEGORY_LABELS } from '@/types/catalog'
import type { CatalogCategory } from '@/types/catalog'
import type { Deal } from '@/types/domain'
import {
  DEFAULT_DAILY_GOAL,
  GOAL_OPTIONS,
  PLAN_DAYS,
  dateKey,
  dayNumber,
  nextAction,
  planFinished,
  week,
} from './planLogic'
import type { DayState, Plan } from './planLogic'
import { updatePlan, usePlan, writePlan } from './planStore'
import './plan.css'

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/* --------------------------------------------------------------- começo */

function PlanSetup() {
  const { preferences } = usePreferences()
  const [serviceKey, setServiceKey] = useState('')
  const [city, setCity] = useState('')
  const [name, setName] = useState(preferences.displayName ?? '')
  const [goal, setGoal] = useState(String(DEFAULT_DAILY_GOAL))
  const [touched, setTouched] = useState(false)

  const service = CATALOG.find((item) => item.key === serviceKey)
  const groups = useMemo(() => {
    const map = new Map<CatalogCategory, typeof CATALOG[number][]>()
    for (const item of CATALOG) map.set(item.category, [...(map.get(item.category) ?? []), item])
    return [...map.entries()]
  }, [])

  const invalid = !service || city.trim().length < 2

  function start() {
    setTouched(true)
    if (invalid || !service) return
    writePlan({
      serviceKey: service.key,
      city: city.trim(),
      senderName: name.trim() || undefined,
      dailyGoal: Number(goal) || DEFAULT_DAILY_GOAL,
      startedOn: dateKey(new Date()),
      log: {},
    })
  }

  return (
    <div className="plan stack">
      <InstallBanner />
      <header className="plan__intro">
        <p className="eyebrow">Plano de 7 dias</p>
        <h2 className="plan__title">Do zero ao primeiro cliente, um passo por dia</h2>
        <p className="secondary">
          Escolha entre {CONTENT_COUNTS.servicos} serviços o que você vai vender e em que cidade. O aplicativo diz o que
          fazer hoje, abre as buscas, escreve a mensagem e guarda quem respondeu. Tudo fica neste aparelho, sem conta e
          sem nuvem.
        </p>
      </header>

      <Panel>
        <div className="panel-body stack">
          <div className="field">
            <label className="field__label" htmlFor="plan-service">
              1. O que você vai vender? <span className="field__required">*</span>
            </label>
            <select
              id="plan-service"
              className="field__input"
              value={serviceKey}
              onChange={(event) => setServiceKey(event.target.value)}
            >
              <option value="">Escolha um serviço…</option>
              {groups.map(([category, items]) => (
                <optgroup key={category} label={CATEGORY_LABELS[category]}>
                  {items.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span className="field__hint">Em dúvida, comece por um de nível iniciante. Dá para trocar depois.</span>
          </div>

          {service && (
            <div className="plan__preview">
              <p className="plan__preview-title">{service.name}</p>
              <p className="secondary">{service.summary}</p>
              <p className="muted">
                Para quem: {lowerFirst(service.audience)}. Execução estimada: {service.hours[0]} a {service.hours[1]} horas.
              </p>
            </div>
          )}

          <TextField
            label="2. Em que cidade você vai procurar clientes?"
            value={city}
            onChange={setCity}
            placeholder="Ex.: Curitiba"
            required
          />
          <TextField
            label="3. Seu nome (aparece nas mensagens)"
            value={name}
            onChange={setName}
            placeholder="Ex.: Ana"
            maxLength={80}
          />
          <SelectField
            label="4. Quantas abordagens por dia você consegue fazer?"
            hint="Comece com um número que você cumpre. Dá para aumentar depois."
            value={goal}
            onChange={setGoal}
            options={GOAL_OPTIONS.map((value) => ({ value: String(value), label: `${value} por dia` }))}
          />

          {touched && invalid && <Notice tone="warning">Escolha um serviço e informe a cidade para começar.</Notice>}

          <Button size="lg" block iconEnd="arrow-right" onClick={start}>
            Começar meu plano de 7 dias
          </Button>
          <p className="muted plan__fineprint">
            As metas medem o seu esforço, não o resultado: o aplicativo não promete que um cliente vá fechar.
          </p>
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------- preparar */

function Prepare({ plan }: { plan: Plan }) {
  const service = CATALOG.find((item) => item.key === plan.serviceKey)
  const [name, setName] = useState(plan.senderName ?? '')
  if (!service) return null

  const sample = buildMessage('whatsapp', 'consultivo', {
    senderName: name.trim() || undefined,
    serviceName: lowerFirst(service.name),
    benefit: lowerFirst(service.summary).replace(/\.$/, ''),
  })

  function confirm() {
    updatePlan((current) => ({
      ...current,
      senderName: name.trim() || undefined,
      readyAt: new Date().toISOString(),
    }))
  }

  return (
    <Panel>
      <div className="panel-body stack" id="preparar">
        <SectionHeader title="O que você vai oferecer" description={service.name} />
        <p className="secondary">{service.problem}</p>

        <div>
          <p className="plan__label">Você entrega</p>
          <ul className="plan__list">
            {service.deliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="plan__label">Como se costuma cobrar</p>
          <ul className="plan__list">
            {service.pricing.map((item) => (
              <li key={item.label}>
                <strong>{item.label}.</strong> {item.note}
              </li>
            ))}
          </ul>
          <p className="muted">O preço é decisão sua. O aplicativo não sabe quanto o seu mercado paga.</p>
        </div>

        <div>
          <p className="plan__label">Cuidado para não prometer demais</p>
          <ul className="plan__list">
            {service.risks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <TextField label="Seu nome nas mensagens" value={name} onChange={setName} placeholder="Ex.: Ana" maxLength={80} />

        <div>
          <p className="plan__label">Exemplo da mensagem que você vai enviar</p>
          <pre className="plan__message">{sample.body}</pre>
          <p className="muted">Na hora de enviar você vê e edita o texto de cada negócio.</p>
        </div>

        <Button icon="check" size="lg" block onClick={confirm}>
          Entendi, minha mensagem está pronta
        </Button>
      </div>
    </Panel>
  )
}

/* -------------------------------------------------------------- semana */

const STATE_LABELS: Record<DayState, string> = {
  feito: 'feito',
  hoje: 'hoje',
  perdido: 'passou',
  pendente: 'pendente',
  futuro: '',
}

function WeekStrip({ plan, now }: { plan: Plan; now: Date }) {
  const days = week(plan, now)
  return (
    <Panel tone="flat">
      <div className="panel-body stack">
        <SectionHeader title="Sua semana" description="Cada dia tem uma tarefa curta. Faltou um dia? Segue de onde parou." />
        <ol className="week" aria-label="Dias do plano">
          {days.map((day) => (
            <li key={day.day} className={`week__day week__day--${day.state}`} aria-current={day.state === 'hoje' ? 'step' : undefined}>
              <span className="week__num">{day.state === 'feito' ? <Icon name="check" size={14} /> : day.day}</span>
              <span className="week__title">{day.title}</span>
              <span className="week__state">{STATE_LABELS[day.state]}</span>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  )
}

/* ----------------------------------------------------------------- casa */

function PlanHome({ plan }: { plan: Plan }) {
  const now = useNow()
  const { items: deals } = useCollection<Deal>('deals')
  const [preparing, setPreparing] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const service = CATALOG.find((item) => item.key === plan.serviceKey)
  const counts = useMemo(() => countPipeline(deals, now), [deals, now])
  const action = nextAction(
    plan,
    {
      novos: counts.novos,
      aguardando: counts.aguardando,
      responderam: counts.responderam,
      retornosDevidos: counts.retornosDevidos,
    },
    now,
  )
  const day = dayNumber(plan, now)
  const finished = planFinished(plan, now)
  const needsPrepare = action.kind === 'ready'

  return (
    <div className="plan stack">
      <InstallBanner />

      <header className="plan__intro">
        <p className="eyebrow">{finished ? 'Rotina diária' : `Dia ${day} de ${PLAN_DAYS}`}</p>
        <h2 className="plan__title">O que fazer hoje</h2>
      </header>

      <Panel tone="accent" className="plan__hero">
        <div className="panel-body stack">
          <Badge tone={action.kind === 'reply' ? 'success' : action.kind === 'done' ? 'success' : 'accent'}>
            {action.kind === 'done' ? 'Em dia' : 'Próxima ação'}
          </Badge>
          <h3 className="plan__hero-title">{action.title}</h3>
          <p className="secondary">{action.detail}</p>
          {action.progress && (
            <Meter
              label="Progresso de hoje"
              value={action.progress.value}
              max={action.progress.max}
              leftLabel="Abordagens de hoje"
              rightLabel={`${action.progress.value} / ${action.progress.max}`}
            />
          )}
          {needsPrepare ? (
            <Button size="lg" block iconEnd="arrow-right" onClick={() => setPreparing((open) => !open)}>
              {preparing ? 'Fechar' : action.cta}
            </Button>
          ) : (
            <LinkButton to={action.to} size="lg" block iconEnd="arrow-right">
              {action.cta}
            </LinkButton>
          )}
        </div>
      </Panel>

      {needsPrepare && preparing && <Prepare plan={plan} />}

      <WeekStrip plan={plan} now={now} />

      <section aria-labelledby="plan-numbers" className="stack">
        <SectionHeader title="Seus números" description="Contagem real do que você registrou. Nada estimado." id="plan-numbers" />
        <div className="plan__stats">
          <Stat label="Na fila" value={counts.novos} to="/clientes?aba=lista&etapa=novo" />
          <Stat label="Aguardando" value={counts.aguardando} to="/clientes?aba=lista&etapa=contatado" />
          <Stat label="Responderam" value={counts.responderam} to="/clientes?aba=lista&etapa=respondeu" />
          <Stat label="Em proposta" value={counts.propostas} to="/clientes?aba=lista&etapa=proposta" />
          <Stat
            label="Fechados"
            value={counts.fechados}
            hint={counts.valorFechado > 0 ? `${BRL.format(counts.valorFechado)} informados por você` : undefined}
            to="/clientes?aba=lista&etapa=fechado"
          />
        </div>
      </section>

      <Panel tone="flat">
        <div className="panel-body stack">
          <p className="plan__label">Seu plano</p>
          <p>
            <strong>{service?.name ?? 'Serviço'}</strong> em {plan.city || 'sua cidade'} · {plan.dailyGoal} abordagens por dia
          </p>
          <div className="plan__actions">
            <LinkButton to="/radar/servicos" variant="secondary" size="sm" icon="compass">
              Ver todos os serviços
            </LinkButton>
            {confirmReset ? (
              <>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    writePlan(null)
                    setConfirmReset(false)
                  }}
                >
                  Confirmar: recomeçar plano
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
                Trocar serviço ou cidade
              </Button>
            )}
          </div>
          {confirmReset && <p className="muted">Recomeçar zera só o plano. Seus negócios salvos continuam na lista.</p>}
        </div>
      </Panel>
    </div>
  )
}

export default function TodayPage() {
  const plan = usePlan()
  if (!plan) return <PlanSetup />
  return <PlanHome plan={plan} />
}

