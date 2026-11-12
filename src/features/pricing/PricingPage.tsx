import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePreferences } from '@/app/preferencesContext'
import { FormGrid, SelectField, TextField } from '@/components/form'
import { Button, Notice, Panel, SectionHeader } from '@/components/ui'
import { HelpTerm } from '@/components/HelpTerm'
import { useCollection } from '@/hooks/useCollection'
import { formatCurrency } from '@/features/offers/offerDocument'
import { repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import type { Offer, ServiceBlueprint } from '@/types/domain'
import { computeQuote, DEFAULT_QUOTE } from './pricing'
import type { QuoteInput } from './pricing'
import './pricing.css'

export default function PricingPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { preferences } = usePreferences()
  const { items: blueprints } = useCollection<ServiceBlueprint>('blueprints')
  const { items: offers } = useCollection<Offer>('offers')

  const [input, setInput] = useState<QuoteInput>(() => ({
    ...DEFAULT_QUOTE,
    hourlyRate: preferences.hourlyRate ?? 0,
  }))
  const [blueprintId, setBlueprintId] = useState(params.get('servico') ?? '')
  const [offerId, setOfferId] = useState(params.get('oferta') ?? '')
  const [feedback, setFeedback] = useState<string | null>(null)

  // Escolher um serviço traz as horas já estimadas no escopo.
  useEffect(() => {
    if (!blueprintId) return
    const blueprint = blueprints.find((item) => item.id === blueprintId)
    if (blueprint) setInput((current) => ({ ...current, hours: blueprint.estimatedHours }))
  }, [blueprintId, blueprints])

  const quote = useMemo(() => computeQuote(input), [input])

  function set<K extends keyof QuoteInput>(field: K, value: string) {
    const parsed = value.trim() === '' ? 0 : Number(value)
    setInput((current) => ({ ...current, [field]: Number.isFinite(parsed) ? parsed : 0 }))
  }

  async function applyToOffer() {
    if (!offerId) return
    const offer = offers.find((item) => item.id === offerId)
    if (!offer) return
    await repositories.offers.update(offer.id, { price: quote.total, revisions: input.revisions })
    dataBus.emit()
    setFeedback(`Preço aplicado à oferta "${offer.name}".`)
  }

  return (
    <div className="pricing">
      <header className="page-intro">
        <h1>Quanto cobrar sem sair no prejuízo</h1>
        <p className="lede">
          A conta parte das suas horas e dos seus custos, e mostra cada passo. Ela responde quanto você precisa cobrar —
          não quanto o mercado paga, porque isso depende da sua região, do seu cliente e da sua experiência.
        </p>
      </header>

      {feedback && <Notice>{feedback}</Notice>}

      <div className="pricing__layout">
        <Panel>
          <div className="panel-body stack">
            <SectionHeader title="Seus números" />
            <p className="secondary">
              Dois conceitos que mudam o resultado: <HelpTerm termKey="valor-hora" label="valor por hora" /> e{' '}
              <HelpTerm termKey="margem" label="margem" />.
            </p>

            {blueprints.length > 0 && (
              <SelectField
                label="Partir de um serviço estruturado"
                value={blueprintId}
                onChange={setBlueprintId}
                options={[
                  { value: '', label: 'Informar as horas manualmente' },
                  ...blueprints.map((item) => ({ value: item.id, label: `${item.name} (${item.estimatedHours} h)` })),
                ]}
              />
            )}

            <FormGrid>
              <TextField
                label="Valor por hora (R$)"
                type="number"
                min={0}
                step={5}
                value={String(input.hourlyRate || '')}
                onChange={(value) => set('hourlyRate', value)}
                hint={preferences.hourlyRate ? 'Vem das suas configurações.' : 'Defina também nas configurações.'}
              />
              <TextField
                label="Horas de execução"
                type="number"
                min={0}
                value={String(input.hours)}
                onChange={(value) => set('hours', value)}
              />
              <TextField
                label="Revisões incluídas"
                type="number"
                min={0}
                value={String(input.revisions)}
                onChange={(value) => set('revisions', value)}
              />
              <TextField
                label="Horas por revisão"
                type="number"
                min={0}
                step={0.5}
                value={String(input.hoursPerRevision)}
                onChange={(value) => set('hoursPerRevision', value)}
              />
              <TextField
                label="Horas de reunião e briefing"
                type="number"
                min={0}
                value={String(input.overheadHours)}
                onChange={(value) => set('overheadHours', value)}
                hint="O tempo que some do dia sem aparecer no orçamento."
              />
              <TextField
                label="Ferramentas (R$)"
                type="number"
                min={0}
                value={String(input.toolCosts)}
                onChange={(value) => set('toolCosts', value)}
              />
              <TextField
                label="Despesas repassadas (R$)"
                type="number"
                min={0}
                value={String(input.expenses)}
                onChange={(value) => set('expenses', value)}
              />
              <TextField
                label="Margem (%)"
                type="number"
                min={0}
                value={String(input.marginPercent)}
                onChange={(value) => set('marginPercent', value)}
                hint="Cobre imprevisto, inadimplência e o trabalho que não vira projeto."
              />
              <TextField
                label="Impostos e taxas (%)"
                type="number"
                min={0}
                value={String(input.taxPercent)}
                onChange={(value) => set('taxPercent', value)}
                hint="Embutido no valor final, não somado por fora."
              />
            </FormGrid>
          </div>
        </Panel>

        <div className="stack">
          <Panel tone="accent">
            <div className="panel-body stack">
              <p className="eyebrow">Preço sugerido pela sua própria conta</p>
              <p className="pricing__total tabular">{formatCurrency(quote.total)}</p>
              <p className="muted">
                {quote.billableHours} h consideradas · equivale a {formatCurrency(quote.effectiveHourlyRate)} por hora
                trabalhada
              </p>

              {offers.length > 0 && (
                <>
                  <hr className="hairline" />
                  <SelectField
                    label="Transferir para uma oferta"
                    value={offerId}
                    onChange={setOfferId}
                    options={[
                      { value: '', label: 'Escolher oferta' },
                      ...offers.map((item) => ({ value: item.id, label: item.name })),
                    ]}
                  />
                  <div className="row">
                    <Button icon="offer" disabled={!offerId} onClick={() => void applyToOffer()}>
                      Aplicar preço à oferta
                    </Button>
                    <Button variant="ghost" icon="plus" onClick={() => navigate('/ofertas/nova')}>
                      Criar oferta
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Panel>

          <Panel>
            <div className="panel-body stack">
              <SectionHeader title="Como esse número foi formado" />
              <ul className="pricing__lines">
                {quote.lines.map((line) => (
                  <li key={line.label}>
                    <div>
                      <p className="pricing__line-label">{line.label}</p>
                      <p className="pricing__line-detail">{line.detail}</p>
                    </div>
                    <span className="tabular">{formatCurrency(line.value)}</span>
                  </li>
                ))}
              </ul>
              <hr className="hairline" />
              <div className="pricing__totals">
                <p>
                  <span>Custo de trabalho</span>
                  <span className="tabular">{formatCurrency(quote.laborCost)}</span>
                </p>
                <p>
                  <span>Custos diretos</span>
                  <span className="tabular">{formatCurrency(quote.directCosts)}</span>
                </p>
                <p>
                  <span>Subtotal</span>
                  <span className="tabular">{formatCurrency(quote.subtotal)}</span>
                </p>
                <p className="pricing__totals-strong">
                  <span>Total</span>
                  <span className="tabular">{formatCurrency(quote.total)}</span>
                </p>
              </div>
            </div>
          </Panel>

          {quote.warnings.length > 0 && (
            <Notice tone="warning">
              <ul className="bullets">
                {quote.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </Notice>
          )}
        </div>
      </div>
    </div>
  )
}
