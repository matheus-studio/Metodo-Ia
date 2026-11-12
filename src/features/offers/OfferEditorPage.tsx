import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FormGrid, ListField, SelectField, TextAreaField, TextField } from '@/components/form'
import { Badge, Button, Icon, Notice, Panel, SectionHeader } from '@/components/ui'
import { HelpTerm } from '@/components/HelpTerm'
import { logActivity, repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import type { Offer, OfferStatus, ServiceBlueprint } from '@/types/domain'
import { offerGaps, offerToMarkdown } from './offerDocument'
import './offers.css'

type FormState = Omit<Offer, 'id' | 'createdAt' | 'updatedAt' | 'price' | 'deadlineDays' | 'revisions'> & {
  price: string
  deadlineDays: string
  revisions: string
}

const EMPTY: FormState = {
  name: '',
  clientOrSegment: '',
  problem: '',
  solution: '',
  valueProposition: '',
  scope: '',
  deliverables: [],
  price: '',
  currency: 'BRL',
  deadlineDays: '',
  revisions: '2',
  clientResponsibilities: [],
  conditions: '',
  differentials: [],
  nextSteps: ['Aprovação desta proposta', 'Envio do briefing e dos materiais', 'Início da execução'],
  callToAction: '',
  status: 'rascunho',
}

function fromBlueprint(blueprint: ServiceBlueprint): FormState {
  return {
    ...EMPTY,
    name: blueprint.name,
    blueprintId: blueprint.id,
    clientOrSegment: blueprint.audience,
    problem: blueprint.problem,
    solution: blueprint.steps.length > 0 ? `Execução em ${blueprint.steps.length} etapas: ${blueprint.steps.join('; ')}.` : '',
    scope: blueprint.deliverables.length > 0 ? `Inclui: ${blueprint.deliverables.join('; ')}.` : '',
    deliverables: [...blueprint.deliverables],
    clientResponsibilities: ['Envio dos materiais necessários', 'Aprovação dentro do prazo combinado'],
  }
}

function toForm(offer: Offer): FormState {
  return {
    ...offer,
    price: offer.price === undefined ? '' : String(offer.price),
    deadlineDays: offer.deadlineDays === undefined ? '' : String(offer.deadlineDays),
    revisions: offer.revisions === undefined ? '' : String(offer.revisions),
  }
}

function toRecord(form: FormState): Omit<Offer, 'id' | 'createdAt' | 'updatedAt'> {
  const price = form.price.trim() === '' ? undefined : Number(form.price)
  const deadlineDays = form.deadlineDays.trim() === '' ? undefined : Number(form.deadlineDays)
  const revisions = form.revisions.trim() === '' ? undefined : Number(form.revisions)
  return {
    ...form,
    name: form.name.trim(),
    price: price !== undefined && Number.isFinite(price) ? price : undefined,
    deadlineDays: deadlineDays !== undefined && Number.isFinite(deadlineDays) ? deadlineDays : undefined,
    revisions: revisions !== undefined && Number.isFinite(revisions) ? revisions : undefined,
  }
}

export default function OfferEditorPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const blueprintId = params.get('blueprint')

  const [form, setForm] = useState<FormState>(EMPTY)
  const [saved, setSaved] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(Boolean(id ?? blueprintId))
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    let alive = true
    void (async () => {
      if (id) {
        const record = await repositories.offers.get(id)
        if (alive && record) {
          setSaved(record)
          setForm(toForm(record))
        }
      } else if (blueprintId) {
        const blueprint = await repositories.blueprints.get(blueprintId)
        if (alive && blueprint) setForm(fromBlueprint(blueprint))
      }
      if (alive) setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [id, blueprintId])

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const preview = useMemo(
    () => offerToMarkdown({ ...toRecord(form), id: 'preview', createdAt: '', updatedAt: '' }),
    [form],
  )
  const gaps = useMemo(
    () => offerGaps({ ...toRecord(form), id: 'preview', createdAt: '', updatedAt: '' }),
    [form],
  )

  async function save(nextStatus?: OfferStatus) {
    if (form.name.trim().length < 2) {
      setFeedback('Dê um nome à oferta antes de salvar.')
      return
    }
    const payload = { ...toRecord(form), status: nextStatus ?? form.status }
    if (saved) {
      const updated = await repositories.offers.update(saved.id, payload)
      setSaved(updated)
      setForm(toForm(updated))
      setFeedback('Oferta atualizada.')
    } else {
      const created = await repositories.offers.create(payload)
      await logActivity({ kind: 'oferta-criada', message: `Oferta criada: ${created.name}.`, refId: created.id })
      setSaved(created)
      setFeedback('Oferta salva.')
      navigate(`/ofertas/${created.id}`, { replace: true })
    }
    dataBus.emit()
  }

  async function duplicate() {
    const copy = await repositories.offers.create({
      ...toRecord(form),
      name: `${form.name} (cópia)`,
      status: 'rascunho',
    })
    dataBus.emit()
    navigate(`/ofertas/${copy.id}`)
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(preview)
      setFeedback('Proposta copiada para a área de transferência.')
    } catch {
      setFeedback('O navegador bloqueou a cópia. Use a exportação em arquivo.')
    }
  }

  function exportFile() {
    const blob = new Blob([preview], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${(form.name || 'proposta').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function remove() {
    if (!saved) return
    await repositories.offers.remove(saved.id)
    dataBus.emit()
    navigate('/ofertas')
  }

  if (loading) {
    return (
      <Panel>
        <div className="panel-body">
          <p className="muted">Carregando oferta…</p>
        </div>
      </Panel>
    )
  }

  return (
    <div className="offer-editor">
      <Link to="/ofertas" className="back-link">
        <Icon name="chevron-right" size={14} />
        Voltar às ofertas
      </Link>

      <header className="page-intro">
        <p className="eyebrow">{saved ? 'Editar oferta' : 'Nova oferta'}</p>
        <h1>{form.name || 'Oferta sem nome'}</h1>
        {form.blueprintId && <p className="muted">Gerada a partir de um serviço estruturado.</p>}
      </header>

      {feedback && <Notice>{feedback}</Notice>}

      {gaps.length > 0 && (
        <Notice tone="warning">
          <strong>Pontos que fragilizam a negociação:</strong>
          <ul className="bullets" style={{ marginTop: 'var(--space-2)' }}>
            {gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </Notice>
      )}

      <Panel>
        <div className="panel-body stack">
          <SectionHeader title="Identificação" />
          <FormGrid>
            <TextField
              label="Nome da oferta"
              required
              value={form.name}
              onChange={(value) => set('name', value)}
              placeholder="Ex.: Presença digital para restaurantes"
            />
            <TextField
              label="Cliente ou segmento"
              value={form.clientOrSegment}
              onChange={(value) => set('clientOrSegment', value)}
              placeholder="Ex.: Cantina do Bairro"
            />
          </FormGrid>
        </div>
      </Panel>

      <Panel>
        <div className="panel-body stack">
          <SectionHeader title="Argumento" description="Problema, solução e valor — na ordem em que o cliente pensa." />
          <p className="secondary">
            Nunca montou uma proposta? Comece pelo que é{' '}
            <HelpTerm termKey="proposta-comercial" label="uma proposta comercial" /> e pelo que é{' '}
            <HelpTerm termKey="escopo" label="escopo" />.
          </p>
          <TextAreaField label="Problema" value={form.problem ?? ''} onChange={(value) => set('problem', value)} />
          <TextAreaField label="Solução" value={form.solution ?? ''} onChange={(value) => set('solution', value)} />
          <TextAreaField
            label="Proposta de valor"
            value={form.valueProposition ?? ''}
            onChange={(value) => set('valueProposition', value)}
            hint="O que muda na rotina ou no resultado do cliente. Evite promessa de faturamento."
          />
          <TextAreaField
            label="Escopo"
            value={form.scope ?? ''}
            onChange={(value) => set('scope', value)}
            hint="Diga também o que não está incluído. É aqui que se evita o trabalho extra não pago."
          />
          <ListField
            label="Entregáveis"
            items={form.deliverables}
            onChange={(items) => set('deliverables', items)}
            placeholder="Ex.: página publicada e responsiva"
          />
        </div>
      </Panel>

      <Panel>
        <div className="panel-body stack">
          <SectionHeader title="Condições comerciais" />
          <FormGrid>
            <TextField
              label="Preço (R$)"
              type="number"
              min={0}
              step={10}
              value={form.price}
              onChange={(value) => set('price', value)}
              hint="Valor que você decidiu cobrar. O app não sugere preço de mercado."
            />
            <TextField
              label="Prazo (dias úteis)"
              type="number"
              min={0}
              value={form.deadlineDays}
              onChange={(value) => set('deadlineDays', value)}
            />
            <TextField
              label="Revisões incluídas"
              type="number"
              min={0}
              value={form.revisions}
              onChange={(value) => set('revisions', value)}
            />
            <SelectField
              label="Situação"
              value={form.status}
              onChange={(value) => set('status', value)}
              options={[
                { value: 'rascunho', label: 'Rascunho' },
                { value: 'enviada', label: 'Enviada' },
                { value: 'aceita', label: 'Aceita' },
                { value: 'recusada', label: 'Recusada' },
              ]}
            />
          </FormGrid>
          <ListField
            label="Responsabilidades do cliente"
            items={form.clientResponsibilities}
            onChange={(items) => set('clientResponsibilities', items)}
            placeholder="Ex.: enviar fotos em até 3 dias"
          />
          <TextAreaField
            label="Condições e observações"
            value={form.conditions ?? ''}
            onChange={(value) => set('conditions', value)}
            hint="Forma de pagamento, validade da proposta, custos de terceiros (hospedagem, gráfica, assinaturas)."
          />
        </div>
      </Panel>

      <Panel>
        <div className="panel-body stack">
          <SectionHeader title="Fechamento" />
          <ListField
            label="Diferenciais"
            items={form.differentials}
            onChange={(items) => set('differentials', items)}
            placeholder="Ex.: treinamento de atualização incluído"
            hint="Só o que for verificável. Diferencial inventado cai na primeira pergunta."
          />
          <ListField
            label="Próximos passos"
            items={form.nextSteps}
            onChange={(items) => set('nextSteps', items)}
            placeholder="Ex.: aprovação desta proposta"
          />
          <TextAreaField
            label="Chamada final"
            value={form.callToAction ?? ''}
            onChange={(value) => set('callToAction', value)}
            rows={3}
            placeholder="Ex.: se fizer sentido, respondo hoje mesmo com o briefing para começarmos na segunda."
          />
        </div>
      </Panel>

      <Panel tone="flat">
        <div className="panel-body stack">
          <SectionHeader
            title="Pré-visualização"
            description="É exatamente este texto que vai para a cópia e para o arquivo."
            action={
              <Button variant="ghost" size="sm" onClick={() => setShowPreview((value) => !value)}>
                {showPreview ? 'Ocultar' : 'Mostrar'}
              </Button>
            }
          />
          {showPreview && <pre className="offer-preview">{preview}</pre>}
        </div>
      </Panel>

      <div className="editor-actions">
        <Button icon="check" onClick={() => void save()}>
          {saved ? 'Salvar alterações' : 'Salvar oferta'}
        </Button>
        <Button variant="secondary" icon="message" onClick={() => void copyText()}>
          Copiar texto
        </Button>
        <Button variant="secondary" icon="download" onClick={exportFile}>
          Exportar
        </Button>
        {saved && (
          <>
            <Button variant="ghost" icon="offer" onClick={() => void duplicate()}>
              Duplicar
            </Button>
            <Button variant="ghost" icon="pipeline" onClick={() => navigate(`/crm?oferta=${saved.id}`)}>
              Abrir no CRM
            </Button>
            {confirmingDelete ? (
              <>
                <Button variant="danger" icon="trash" onClick={() => void remove()}>
                  Confirmar exclusão
                </Button>
                <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
                  Cancelar
                </Button>
              </>
            ) : (
              <Button variant="ghost" icon="trash" onClick={() => setConfirmingDelete(true)}>
                Excluir
              </Button>
            )}
          </>
        )}
      </div>

      {saved?.status === 'aceita' && (
        <Notice tone="info">
          <strong>Oferta aceita.</strong> O módulo de projetos entra no Marco 4 — por enquanto, registre o andamento
          como negociação fechada no CRM. <Badge tone="neutral">Marco 4</Badge>
        </Notice>
      )}
    </div>
  )
}
