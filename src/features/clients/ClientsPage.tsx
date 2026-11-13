import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge, Button, EmptyState, Icon, LinkButton, Notice, Panel, SectionHeader } from '@/components/ui'
import { SelectField, TextAreaField, TextField } from '@/components/form'
import { CATALOG } from '@/features/catalog/catalogData'
import { CHANNEL_LABELS, whatsappLink } from '@/features/prospecting/messageTemplates'
import type { Channel } from '@/features/prospecting/messageTemplates'
import { bump } from '@/features/plan/planLogic'
import { updatePlan, usePlan } from '@/features/plan/planStore'
import type { Plan } from '@/features/plan/planLogic'
import { useCollection } from '@/hooks/useCollection'
import { useNow } from '@/hooks/useNow'
import { logActivity, repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import type { CompanyLead, Deal, DealStage } from '@/types/domain'
import type { CatalogService } from '@/types/catalog'
import {
  ETAPAS,
  ETAPA_LABELS,
  RAMOS,
  SITE_CHECK_LABELS,
  buildLeads,
  countPipeline,
  daysSince,
  draftFor,
  etapaOf,
  followupAt,
  isEtapa,
  isFollowupDue,
  presenceFor,
  searchLinks,
  suggestedRamos,
} from './clientsLogic'
import type { Etapa, Lead, SiteCheck } from './clientsLogic'
import './clients.css'

type Aba = 'achar' | 'lista'

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/* ------------------------------------------------------------- achar */

function FindTab({ plan, service, onSaved }: { plan: Plan; service: CatalogService | undefined; onSaved: () => void }) {
  const suggested = useMemo(() => suggestedRamos(service), [service])
  const orderedRamos = useMemo(
    () => [...RAMOS].sort((a, b) => Number(suggested.includes(b.key)) - Number(suggested.includes(a.key))),
    [suggested],
  )
  const [ramoKey, setRamoKey] = useState<string>(orderedRamos[0]?.key ?? '')
  const [custom, setCustom] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [segment, setSegment] = useState('')
  const [site, setSite] = useState<SiteCheck>('nao-verifiquei')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const ramo = RAMOS.find((item) => item.key === ramoKey)
  const terms = [...(ramo?.terms ?? []), ...(custom.trim() ? [custom.trim()] : [])]

  async function save() {
    if (name.trim().length < 2 || saving) return
    setSaving(true)
    try {
      const company = await repositories.companies.create({
        name: name.trim(),
        segment: segment.trim() || ramo?.label || 'Não informado',
        city: plan.city || 'Não informada',
        phone: phone.trim() || undefined,
        digitalPresence: presenceFor(site),
        source: 'manual',
        checkedAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
      })
      await repositories.deals.create({
        title: `${service?.name ?? 'Serviço'} — ${company.name}`,
        stage: 'novo',
        companyId: company.id,
      })
      await logActivity({ kind: 'empresa-registrada', message: `Negócio salvo na fila: ${company.name}.`, refId: company.id })
      updatePlan((current) => bump(current, 'salvos', new Date()))
      dataBus.emit()
      setName('')
      setPhone('')
      setNotes('')
      setSite('nao-verifiquei')
      setMessage(`${company.name} salvo na sua fila.`)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack">
      <Panel>
        <div className="panel-body stack">
          <SectionHeader
            title="1. Procure negócios"
            description={`Escolha o tipo de negócio. O app abre a busca em ${plan.city || 'sua cidade'}; quem olha e decide é você.`}
          />
          <div className="chips" role="group" aria-label="Tipo de negócio">
            {orderedRamos.map((item) => (
              <button
                key={item.key}
                type="button"
                className={item.key === ramoKey ? 'chip is-active' : 'chip'}
                aria-pressed={item.key === ramoKey}
                onClick={() => setRamoKey(item.key)}
              >
                {item.label}
                {suggested.includes(item.key) && <span className="chip__tag">sugerido</span>}
              </button>
            ))}
          </div>

          <ul className="search-list">
            {terms.map((term) => {
              const links = searchLinks(term, plan.city)
              return (
                <li key={term} className="search-row">
                  <span className="search-row__term">{term}</span>
                  <span className="search-row__links">
                    <a className="btn btn--secondary btn--sm" href={links.maps} target="_blank" rel="noopener noreferrer">
                      <span className="btn__label">Mapa</span>
                    </a>
                    <a className="btn btn--ghost btn--sm" href={links.google} target="_blank" rel="noopener noreferrer">
                      <span className="btn__label">Google</span>
                    </a>
                    <a className="btn btn--ghost btn--sm" href={links.instagram} target="_blank" rel="noopener noreferrer">
                      <span className="btn__label">Instagram</span>
                    </a>
                  </span>
                </li>
              )
            })}
          </ul>

          <TextField
            label="Outro tipo de negócio"
            value={custom}
            onChange={setCustom}
            placeholder="Ex.: loja de bicicletas"
            maxLength={60}
          />

          <Notice>
            <strong>Antes de salvar, confira:</strong>
            <ul className="plan-checklist">
              <li>Tem telefone ou WhatsApp à vista? Sem contato, pule.</li>
              <li>Pesquise o nome do negócio no Google antes de achar que ele não tem site.</li>
              <li>O perfil está parado há meses ou desatualizado? É um bom sinal de que precisa de ajuda.</li>
            </ul>
          </Notice>
        </div>
      </Panel>

      <Panel>
        <div className="panel-body stack">
          <SectionHeader title="2. Salve na sua fila" description="Só o que você viu com os próprios olhos." />
          <TextField label="Nome do negócio" value={name} onChange={setName} required maxLength={120} />
          <TextField
            label="Telefone / WhatsApp"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="(41) 99999-0000"
            maxLength={30}
            hint="Com o número, o app abre a conversa com a mensagem pronta."
          />
          <TextField
            label="Tipo de negócio"
            value={segment}
            onChange={setSegment}
            placeholder={ramo?.label}
            maxLength={80}
          />
          <SelectField
            label="Site"
            value={site}
            onChange={setSite}
            options={(Object.keys(SITE_CHECK_LABELS) as SiteCheck[]).map((value) => ({ value, label: SITE_CHECK_LABELS[value] }))}
          />
          <TextAreaField
            label="Observação verificada (opcional)"
            hint="Entra na mensagem. Escreva só o que você conferiu, por exemplo: o último post do perfil é de 2024."
            value={notes}
            onChange={setNotes}
            maxLength={300}
            rows={3}
          />
          <Button icon="plus" size="lg" block onClick={save} disabled={name.trim().length < 2 || saving}>
            Salvar na minha fila
          </Button>
          {message && (
            <Notice>
              {message}{' '}
              <Link to="/clientes?aba=lista&etapa=novo" className="link">
                Ver fila
              </Link>
            </Notice>
          )}
        </div>
      </Panel>
    </div>
  )
}

/* -------------------------------------------------------------- cartão */

function MessageBox({
  lead,
  service,
  plan,
  mode,
  onSent,
}: {
  lead: Lead
  service: CatalogService | undefined
  plan: Plan
  mode: 'primeira' | 'retorno'
  onSent: () => void
}) {
  const now = useNow()
  const [channel, setChannel] = useState<Channel>(mode === 'retorno' ? 'followup' : 'whatsapp')
  const draft = useMemo(
    () => draftFor({ lead, service, senderName: plan.senderName, channel, now }),
    [lead, service, plan.senderName, channel, now],
  )
  const [edited, setEdited] = useState<{ channel: Channel; text: string } | null>(null)
  const text = edited && edited.channel === channel ? edited.text : draft.body
  const [copied, setCopied] = useState(false)

  const phone = lead.company?.phone
  const waLink = phone ? whatsappLink(phone, text) : null
  const channels: Channel[] = mode === 'retorno' ? ['followup'] : ['whatsapp', 'instagram', 'email']

  return (
    <div className="message-box stack">
      {channels.length > 1 && (
        <SelectField
          label="Canal"
          value={channel}
          onChange={setChannel}
          options={channels.map((value) => ({ value, label: CHANNEL_LABELS[value] }))}
        />
      )}
      <TextAreaField label="Mensagem (edite à vontade)" value={text} onChange={(value) => setEdited({ channel, text: value })} rows={8} maxLength={1500} />
      {draft.warnings.map((warning) => (
        <p key={warning} className="muted message-box__warning">
          <Icon name="alert" size={14} /> {warning}
        </p>
      ))}
      <div className="lead-card__actions">
        <Button
          variant="secondary"
          icon="message"
          onClick={async () => {
            const ok = await copyText(text)
            setCopied(ok)
            window.setTimeout(() => setCopied(false), 2500)
          }}
        >
          {copied ? 'Copiado!' : 'Copiar mensagem'}
        </Button>
        {waLink ? (
          <a className="btn btn--secondary btn--md" href={waLink} target="_blank" rel="noopener noreferrer">
            <span className="btn__label">Abrir no WhatsApp</span>
          </a>
        ) : (
          phone && <span className="muted">Confira o número: não parece válido.</span>
        )}
      </div>
      <Button icon="check" block onClick={onSent}>
        {mode === 'retorno' ? 'Já enviei o retorno' : 'Já enviei a mensagem'}
      </Button>
      <p className="muted">O envio é sempre seu, uma mensagem por vez. Só toque aqui depois de enviar.</p>
    </div>
  )
}

function LeadCard({ lead, service, plan, now }: { lead: Lead; service: CatalogService | undefined; plan: Plan; now: Date }) {
  const { deal, company } = lead
  const etapa = etapaOf(deal.stage)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [value, setValue] = useState('')
  const due = isFollowupDue(deal, now)

  async function move(stage: DealStage, extra: Partial<Deal> = {}) {
    await repositories.deals.update(deal.id, { stage, ...extra })
    await logActivity({ kind: 'negociacao-atualizada', message: `${lead.name}: ${ETAPA_LABELS[etapaOf(stage)]}.`, refId: deal.id })
    dataBus.emit()
    setOpen(false)
    setClosing(false)
  }

  async function sentFirst() {
    updatePlan((current) => bump(current, 'abordagens', new Date()))
    await move('contatado', { nextActionAt: followupAt(new Date()) })
  }

  async function sentFollowup() {
    updatePlan((current) => bump(current, 'followups', new Date()))
    await move('contatado', { nextActionAt: followupAt(new Date(), 3) })
  }

  async function close() {
    const amount = Number(value.replace(',', '.'))
    await move('fechado', { potentialValue: Number.isFinite(amount) && amount > 0 ? amount : undefined })
  }

  return (
    <li className="lead-card">
      <div className="lead-card__head">
        <div>
          <p className="lead-card__name">{lead.name}</p>
          <p className="muted lead-card__meta">
            {[company?.segment, company?.phone].filter(Boolean).join(' · ') || 'Sem detalhes'}
          </p>
        </div>
        <Badge tone={etapa === 'respondeu' ? 'success' : etapa === 'fechado' ? 'success' : 'neutral'}>
          {due ? 'Dar retorno' : ETAPA_LABELS[etapa]}
        </Badge>
      </div>

      {company?.notes && <p className="secondary lead-card__notes">{company.notes}</p>}

      {etapa === 'novo' && (
        <>
          {open ? (
            <MessageBox lead={lead} service={service} plan={plan} mode="primeira" onSent={sentFirst} />
          ) : (
            <Button iconEnd="arrow-right" block onClick={() => setOpen(true)}>
              Abordar
            </Button>
          )}
        </>
      )}

      {etapa === 'contatado' && (
        <>
          <p className="muted">
            Abordado há {daysSince(deal.updatedAt, now)} dia(s). {due ? 'Já dá para dar um retorno.' : 'Aguarde um pouco antes de insistir.'}
          </p>
          {open ? (
            <MessageBox lead={lead} service={service} plan={plan} mode="retorno" onSent={sentFollowup} />
          ) : (
            <div className="lead-card__actions">
              <Button variant={due ? 'primary' : 'secondary'} onClick={() => setOpen(true)}>
                Dar retorno
              </Button>
              <Button variant="secondary" icon="check" onClick={() => move('respondeu')}>
                Respondeu
              </Button>
              <Button variant="ghost" onClick={() => move('perdido')}>
                Sem interesse
              </Button>
            </div>
          )}
        </>
      )}

      {etapa === 'respondeu' && (
        <>
          <p className="secondary">
            Responda hoje. Entenda o que a pessoa precisa e envie uma proposta curta, com escopo, prazo e valor por escrito.
          </p>
          <div className="lead-card__actions">
            <LinkButton to="/ofertas/nova" variant="secondary" size="sm" icon="offer">
              Montar proposta
            </LinkButton>
            <Button size="sm" onClick={() => move('proposta')}>
              Enviei a proposta
            </Button>
            <Button size="sm" variant="ghost" onClick={() => move('perdido')}>
              Sem interesse
            </Button>
          </div>
        </>
      )}

      {etapa === 'proposta' && (
        <>
          {closing ? (
            <div className="stack">
              <TextField
                label="Valor fechado (R$)"
                type="number"
                value={value}
                onChange={setValue}
                min={0}
                step={1}
                hint="Opcional. Só você sabe esse número; o app apenas guarda."
              />
              <div className="lead-card__actions">
                <Button icon="check" onClick={close}>
                  Confirmar fechamento
                </Button>
                <Button variant="ghost" onClick={() => setClosing(false)}>
                  Voltar
                </Button>
              </div>
            </div>
          ) : (
            <div className="lead-card__actions">
              <Button icon="check" onClick={() => setClosing(true)}>
                Fechou
              </Button>
              <Button variant="ghost" onClick={() => move('perdido')}>
                Não fechou
              </Button>
            </div>
          )}
        </>
      )}

      {etapa === 'fechado' && (
        <>
          <p className="secondary">
            Fechado{deal.potentialValue ? ` por ${BRL.format(deal.potentialValue)}` : ''}. Agora é entregar bem: combine
            escopo, prazo e revisões por escrito.
          </p>
          <LinkButton to="/projetos" variant="secondary" size="sm" icon="project">
            Acompanhar a entrega
          </LinkButton>
        </>
      )}

      {etapa === 'perdido' && (
        <Button variant="ghost" size="sm" onClick={() => move('novo')}>
          Colocar de volta na fila
        </Button>
      )}
    </li>
  )
}

/* ------------------------------------------------------------- lista */

function ListTab({ plan, service, etapa, onEtapa }: { plan: Plan; service: CatalogService | undefined; etapa: Etapa; onEtapa: (value: Etapa) => void }) {
  const { items: deals } = useCollection<Deal>('deals')
  const { items: companies } = useCollection<CompanyLead>('companies')
  const now = useNow()
  const leads = useMemo(() => buildLeads(deals, companies), [deals, companies])
  const counts = useMemo(() => {
    const result = Object.fromEntries(ETAPAS.map((value) => [value, 0])) as Record<Etapa, number>
    for (const lead of leads) result[etapaOf(lead.deal.stage)] += 1
    return result
  }, [leads])
  const shown = leads.filter((lead) => etapaOf(lead.deal.stage) === etapa)
  const pipeline = countPipeline(deals, now)

  return (
    <div className="stack">
      <div className="chips" role="group" aria-label="Etapa">
        {ETAPAS.map((value) => (
          <button
            key={value}
            type="button"
            className={value === etapa ? 'chip is-active' : 'chip'}
            aria-pressed={value === etapa}
            onClick={() => onEtapa(value)}
          >
            {ETAPA_LABELS[value]}
            <span className="chip__count tabular">{counts[value]}</span>
          </button>
        ))}
      </div>

      {etapa === 'contatado' && pipeline.retornosDevidos > 0 && (
        <Notice>
          {pipeline.retornosDevidos} {pipeline.retornosDevidos === 1 ? 'negócio já pode receber' : 'negócios já podem receber'} um retorno.
        </Notice>
      )}

      {shown.length === 0 ? (
        <EmptyState
          icon="pipeline"
          title={etapa === 'novo' ? 'Sua fila está vazia' : `Ninguém em "${ETAPA_LABELS[etapa]}" por enquanto`}
          text={
            etapa === 'novo'
              ? 'Procure negócios na aba "Achar" e salve os que fazem sentido.'
              : 'Quando você registrar o andamento dos negócios, eles aparecem aqui.'
          }
        />
      ) : (
        <ul className="lead-list">
          {shown.map((lead) => (
            <LeadCard key={lead.deal.id} lead={lead} service={service} plan={plan} now={now} />
          ))}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- página */

export default function ClientsPage() {
  const plan = usePlan()
  const [params, setParams] = useSearchParams()
  const aba: Aba = params.get('aba') === 'achar' ? 'achar' : 'lista'
  const etapaParam = params.get('etapa')
  const etapa: Etapa = isEtapa(etapaParam) ? etapaParam : 'novo'
  const service = CATALOG.find((item) => item.key === plan?.serviceKey)

  function go(next: { aba?: Aba; etapa?: Etapa }) {
    const merged = new URLSearchParams(params)
    if (next.aba) merged.set('aba', next.aba)
    if (next.etapa) merged.set('etapa', next.etapa)
    setParams(merged, { replace: true })
  }

  if (!plan) {
    return (
      <EmptyState
        icon="target"
        title="Comece pelo seu plano"
        text="Escolha o serviço e a cidade na tela Hoje. Em dois minutos o app já sabe onde procurar clientes."
        action={
          <LinkButton to="/" iconEnd="arrow-right">
            Ir para Hoje
          </LinkButton>
        }
      />
    )
  }

  return (
    <div className="clients stack">
      <div className="tabs" role="tablist" aria-label="Clientes">
        <button type="button" role="tab" aria-selected={aba === 'achar'} className={aba === 'achar' ? 'tab is-active' : 'tab'} onClick={() => go({ aba: 'achar' })}>
          Achar clientes
        </button>
        <button type="button" role="tab" aria-selected={aba === 'lista'} className={aba === 'lista' ? 'tab is-active' : 'tab'} onClick={() => go({ aba: 'lista' })}>
          Minha lista
        </button>
      </div>

      {aba === 'achar' ? (
        <FindTab plan={plan} service={service} onSaved={() => undefined} />
      ) : (
        <ListTab plan={plan} service={service} etapa={etapa} onEtapa={(value) => go({ etapa: value })} />
      )}
    </div>
  )
}
