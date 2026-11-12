import { useMemo, useState } from 'react'
import { FormGrid, SelectField, TextAreaField, TextField } from '@/components/form'
import { Badge, Button, EmptyState, Icon, Panel, SectionHeader, Stat } from '@/components/ui'
import { HelpTerm } from '@/components/HelpTerm'
import { formatCurrency } from '@/features/offers/offerDocument'
import { logActivity, repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import { DEAL_STAGES } from '@/types/domain'
import type { CompanyLead, Contact, Deal, DealStage, Offer } from '@/types/domain'
import { filterDeals, nextStage, STAGE_HELP, STAGE_LABELS, summarizePipeline } from './crmLogic'

const STAGE_TONE: Record<DealStage, 'neutral' | 'data' | 'success' | 'danger' | 'accent'> = {
  novo: 'neutral',
  contatado: 'data',
  respondeu: 'data',
  proposta: 'accent',
  negociacao: 'accent',
  fechado: 'success',
  perdido: 'danger',
}

interface Props {
  deals: Deal[]
  contacts: Contact[]
  companies: CompanyLead[]
  offers: Offer[]
}

export function DealsTab({ deals, contacts, companies, offers }: Props) {
  const [text, setText] = useState('')
  const [includeClosed, setIncludeClosed] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', contactId: '', companyId: '', offerId: '', value: '', notes: '' })

  const summary = useMemo(() => summarizePipeline(deals), [deals])
  const visible = useMemo(
    () => filterDeals(deals, { text, includeClosed }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [deals, text, includeClosed],
  )

  function resetForm() {
    setForm({ title: '', contactId: '', companyId: '', offerId: '', value: '', notes: '' })
    setCreating(false)
    setEditing(null)
  }

  async function createDeal() {
    if (form.title.trim().length < 2) return
    const value = form.value.trim() === '' ? undefined : Number(form.value)
    const created = await repositories.deals.create({
      title: form.title.trim(),
      stage: 'novo',
      contactId: form.contactId || undefined,
      companyId: form.companyId || undefined,
      offerId: form.offerId || undefined,
      potentialValue: value !== undefined && Number.isFinite(value) ? value : undefined,
      notes: form.notes.trim() || undefined,
    })
    await logActivity({ kind: 'negociacao-atualizada', message: `Negociação criada: ${created.title}.`, refId: created.id })
    dataBus.emit()
    resetForm()
  }

  async function changeStage(deal: Deal, stage: DealStage) {
    await repositories.deals.update(deal.id, { stage })
    await logActivity({
      kind: 'negociacao-atualizada',
      message: `${deal.title}: ${STAGE_LABELS[deal.stage]} → ${STAGE_LABELS[stage]}.`,
      refId: deal.id,
    })
    dataBus.emit()
  }

  async function saveNotes(deal: Deal, notes: string, value: string) {
    const parsed = value.trim() === '' ? undefined : Number(value)
    await repositories.deals.update(deal.id, {
      notes: notes.trim() || undefined,
      potentialValue: parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined,
    })
    dataBus.emit()
    setEditing(null)
  }

  async function removeDeal(deal: Deal) {
    await repositories.deals.remove(deal.id)
    dataBus.emit()
  }

  return (
    <div className="stack">
      <p className="secondary crm__help-row">
        Dúvida nos termos? <HelpTerm termKey="funil" label="funil de vendas" /> ·{' '}
        <HelpTerm termKey="lead" label="lead" /> · <HelpTerm termKey="follow-up" label="follow-up" />
      </p>

      <div className="stat-grid crm__summary">
        <Stat label="Em andamento" value={summary.active} icon="pipeline" />
        <Stat label="Fechadas" value={summary.closed} icon="check" />
        <Stat label="Perdidas" value={summary.lost} icon="close" />
        <Stat
          label="Valor informado"
          value={summary.declaredActiveValue > 0 ? formatCurrency(summary.declaredActiveValue) : '—'}
          hint={
            summary.dealsWithoutValue > 0
              ? `${summary.dealsWithoutValue} negociação(ões) sem valor informado`
              : 'Soma do que você registrou'
          }
          icon="calculator"
        />
      </div>

      <Panel tone="flat">
        <div className="panel-body stack">
          <div className="crm__toolbar">
            <div className="catalog__search">
              <Icon name="search" size={18} />
              <input
                type="search"
                className="catalog__search-input"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Buscar negociação"
                aria-label="Buscar negociação"
              />
            </div>
            <div className="row">
              <button
                type="button"
                className={includeClosed ? 'chip is-selected' : 'chip'}
                aria-pressed={includeClosed}
                onClick={() => setIncludeClosed((value) => !value)}
              >
                Mostrar encerradas
              </button>
              <Button icon="plus" size="sm" onClick={() => setCreating((value) => !value)}>
                Nova negociação
              </Button>
            </div>
          </div>

          {creating && (
            <div className="stack crm__form">
              <FormGrid>
                <TextField
                  label="Título"
                  required
                  value={form.title}
                  onChange={(value) => setForm({ ...form, title: value })}
                  placeholder="Ex.: Cantina do Bairro — site com cardápio"
                />
                <TextField
                  label="Valor potencial (R$)"
                  type="number"
                  min={0}
                  value={form.value}
                  onChange={(value) => setForm({ ...form, value })}
                  hint="Valor que você espera cobrar. O app nunca estima isso por você."
                />
                <SelectField
                  label="Contato"
                  value={form.contactId}
                  onChange={(value) => setForm({ ...form, contactId: value })}
                  options={[
                    { value: '', label: 'Sem contato' },
                    ...contacts.map((item) => ({ value: item.id, label: item.name })),
                  ]}
                />
                <SelectField
                  label="Empresa"
                  value={form.companyId}
                  onChange={(value) => setForm({ ...form, companyId: value })}
                  options={[
                    { value: '', label: 'Sem empresa' },
                    ...companies.map((item) => ({ value: item.id, label: item.name })),
                  ]}
                />
                <SelectField
                  label="Oferta"
                  value={form.offerId}
                  onChange={(value) => setForm({ ...form, offerId: value })}
                  options={[
                    { value: '', label: 'Sem oferta' },
                    ...offers.map((item) => ({ value: item.id, label: item.name })),
                  ]}
                />
              </FormGrid>
              <TextAreaField
                label="Notas"
                rows={2}
                value={form.notes}
                onChange={(value) => setForm({ ...form, notes: value })}
              />
              <div className="row">
                <Button icon="check" onClick={() => void createDeal()}>
                  Criar negociação
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Panel>

      {visible.length === 0 ? (
        <Panel>
          <EmptyState
            icon="pipeline"
            title={deals.length === 0 ? 'Nenhuma negociação ainda' : 'Nada com esse filtro'}
            text={
              deals.length === 0
                ? 'Negociações aparecem aqui quando você registra uma abordagem na prospecção ou cria uma à mão.'
                : 'Tente outro termo ou mostre também as negociações encerradas.'
            }
          />
        </Panel>
      ) : (
        <>
        {/* Título de nível 2 para a lista: sem ele os cards (h3) seguiriam
            direto do h1 da página, quebrando a ordem de cabeçalhos. */}
        <h2 className="sr-only">Negociações</h2>
        <ul className="deal-list">
          {visible.map((deal, index) => {
            const contact = contacts.find((item) => item.id === deal.contactId)
            const company = companies.find((item) => item.id === deal.companyId)
            const offer = offers.find((item) => item.id === deal.offerId)
            const advance = nextStage(deal.stage)
            const isEditing = editing === deal.id

            return (
              <li
                key={deal.id}
                className="deal-card animate-rise"
                style={{ '--stagger-index': Math.min(index, 8) } as React.CSSProperties}
              >
                <div className="deal-card__head">
                  <Badge tone={STAGE_TONE[deal.stage] === 'accent' ? 'accent' : STAGE_TONE[deal.stage]} dot>
                    {STAGE_LABELS[deal.stage]}
                  </Badge>
                  {deal.potentialValue !== undefined && (
                    <span className="offer-card__price tabular">{formatCurrency(deal.potentialValue)}</span>
                  )}
                </div>

                <h3 className="deal-card__title">{deal.title}</h3>
                <p className="deal-card__meta">
                  {[company?.name, contact?.name, offer?.name].filter(Boolean).join(' · ') || 'Sem vínculos'}
                </p>
                <p className="muted deal-card__help">{STAGE_HELP[deal.stage]}</p>

                {deal.notes && !isEditing && <p className="deal-card__notes">{deal.notes}</p>}

                {isEditing ? (
                  <EditDealForm deal={deal} onCancel={() => setEditing(null)} onSave={saveNotes} />
                ) : (
                  <>
                    <div className="deal-card__stages">
                      {DEAL_STAGES.map((stage) => (
                        <button
                          key={stage}
                          type="button"
                          className={stage === deal.stage ? 'stage-pill is-current' : 'stage-pill'}
                          aria-pressed={stage === deal.stage}
                          aria-label={`Mover ${deal.title} para ${STAGE_LABELS[stage]}`}
                          onClick={() => void changeStage(deal, stage)}
                        >
                          {STAGE_LABELS[stage]}
                        </button>
                      ))}
                    </div>

                    <div className="deal-card__actions">
                      {advance && (
                        <Button size="sm" icon="arrow-right" onClick={() => void changeStage(deal, advance)}>
                          Avançar para {STAGE_LABELS[advance]}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" icon="blueprint" onClick={() => setEditing(deal.id)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" icon="trash" onClick={() => void removeDeal(deal)}>
                        Excluir
                      </Button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
        </>
      )}

      <Panel tone="flat">
        <div className="panel-body stack">
          <SectionHeader
            title="O que é um CRM, afinal"
            description="Se o termo é novo para você, leia uma vez e nunca mais precise."
          />
          <p className="secondary">
            CRM é só um lugar organizado para acompanhar conversas comerciais: quem é o contato, em que ponto está a
            conversa, o que foi combinado e qual é o próximo passo. Sem isso, quem decide quem você vai procurar hoje é
            a sua memória — e ela esquece justamente o cliente que estava quase fechando.
          </p>
          <p className="secondary">
            Use os estágios como uma linha do tempo: mova a negociação assim que algo acontecer de verdade. Um funil
            cheio de "Contatado" de dois meses atrás não é um funil, é uma lista de pendências.
          </p>
        </div>
      </Panel>
    </div>
  )
}

function EditDealForm({
  deal,
  onCancel,
  onSave,
}: {
  deal: Deal
  onCancel: () => void
  onSave: (deal: Deal, notes: string, value: string) => Promise<void>
}) {
  const [notes, setNotes] = useState(deal.notes ?? '')
  const [value, setValue] = useState(deal.potentialValue === undefined ? '' : String(deal.potentialValue))

  return (
    <div className="stack crm__form">
      <TextAreaField label="Notas" rows={3} value={notes} onChange={setNotes} />
      <TextField label="Valor potencial (R$)" type="number" min={0} value={value} onChange={setValue} />
      <div className="row">
        <Button size="sm" icon="check" onClick={() => void onSave(deal, notes, value)}>
          Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
