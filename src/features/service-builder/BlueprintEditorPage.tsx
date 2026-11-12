import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FormGrid, ListField, SelectField, TextAreaField, TextField } from '@/components/form'
import { Button, Icon, Notice, Panel, SectionHeader } from '@/components/ui'
import { serviceByKey } from '@/features/catalog/catalogData'
import { logActivity, repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import type { BlueprintStatus, ServiceBlueprint } from '@/types/domain'
import './service-builder.css'

interface FormState {
  name: string
  catalogKey?: string
  problem: string
  audience: string
  deliverables: string[]
  tools: string[]
  steps: string[]
  estimatedHours: string
  risks: string[]
  status: BlueprintStatus
}

const EMPTY: FormState = {
  name: '',
  problem: '',
  audience: '',
  deliverables: [],
  tools: [],
  steps: [],
  estimatedHours: '8',
  risks: [],
  status: 'rascunho',
}

function fromCatalog(key: string): FormState | null {
  const service = serviceByKey(key)
  if (!service) return null
  return {
    name: service.name,
    catalogKey: service.key,
    problem: service.problem,
    audience: service.audience,
    deliverables: [...service.deliverables],
    tools: [...service.tools],
    steps: [...service.plan],
    estimatedHours: String(service.hours[0]),
    risks: [...service.risks],
    status: 'rascunho',
  }
}

function fromRecord(record: ServiceBlueprint): FormState {
  return {
    name: record.name,
    catalogKey: record.catalogKey,
    problem: record.problem,
    audience: record.audience,
    deliverables: [...record.deliverables],
    tools: [...record.tools],
    steps: [...record.steps],
    estimatedHours: String(record.estimatedHours),
    risks: [...record.risks],
    status: record.status,
  }
}

export default function BlueprintEditorPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const catalogKey = params.get('catalogo')

  const [form, setForm] = useState<FormState>(() => (catalogKey ? (fromCatalog(catalogKey) ?? EMPTY) : EMPTY))
  const [loading, setLoading] = useState(Boolean(id))
  const [saved, setSaved] = useState<ServiceBlueprint | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!id) return
    let alive = true
    void (async () => {
      const record = await repositories.blueprints.get(id)
      if (!alive) return
      if (record) {
        setSaved(record)
        setForm(fromRecord(record))
      }
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [id])

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const hours = Number(form.estimatedHours)
  const valid = form.name.trim().length > 1 && form.problem.trim().length > 3 && Number.isFinite(hours) && hours >= 0

  async function save(nextStatus?: BlueprintStatus) {
    if (!valid) {
      setFeedback('Preencha ao menos nome, problema e tempo estimado antes de salvar.')
      return
    }
    const payload = {
      name: form.name.trim(),
      catalogKey: form.catalogKey,
      problem: form.problem.trim(),
      audience: form.audience.trim(),
      deliverables: form.deliverables,
      tools: form.tools,
      steps: form.steps,
      estimatedHours: hours,
      risks: form.risks,
      status: nextStatus ?? form.status,
    }

    if (saved) {
      const updated = await repositories.blueprints.update(saved.id, payload)
      setSaved(updated)
      setForm(fromRecord(updated))
      setFeedback('Serviço atualizado.')
    } else {
      const created = await repositories.blueprints.create(payload)
      await logActivity({ kind: 'servico-criado', message: `Serviço estruturado: ${created.name}.`, refId: created.id })
      setSaved(created)
      setFeedback('Serviço salvo.')
      navigate(`/servicos/${created.id}`, { replace: true })
    }
    dataBus.emit()
  }

  async function remove() {
    if (!saved) return
    await repositories.blueprints.remove(saved.id)
    dataBus.emit()
    navigate('/servicos')
  }

  if (loading) {
    return (
      <Panel>
        <div className="panel-body">
          <p className="muted">Carregando serviço…</p>
        </div>
      </Panel>
    )
  }

  return (
    <div className="blueprint-editor">
      <Link to="/servicos" className="back-link">
        <Icon name="chevron-right" size={14} />
        Voltar aos serviços
      </Link>

      <header className="page-intro">
        <p className="eyebrow">{saved ? 'Editar serviço' : 'Novo serviço'}</p>
        <h1>{form.name || 'Serviço sem nome'}</h1>
        {form.catalogKey && (
          <p className="muted">
            Partiu do catálogo:{' '}
            <Link to={`/radar/servicos/${form.catalogKey}`} className="dashboard__link">
              {serviceByKey(form.catalogKey)?.name}
            </Link>
          </p>
        )}
      </header>

      {feedback && <Notice>{feedback}</Notice>}

      <Panel>
        <div className="panel-body stack">
          <SectionHeader title="O essencial" description="Sem isto, a proposta vira adivinhação." />
          <FormGrid>
            <TextField
              label="Nome do serviço"
              required
              value={form.name}
              onChange={(value) => set('name', value)}
              placeholder="Ex.: Site institucional com cardápio digital"
            />
            <TextField
              label="Público"
              value={form.audience}
              onChange={(value) => set('audience', value)}
              placeholder="Ex.: restaurantes de bairro"
            />
          </FormGrid>
          <TextAreaField
            label="Problema que o serviço resolve"
            required
            value={form.problem}
            onChange={(value) => set('problem', value)}
            hint="Escreva na linguagem do cliente, não na sua. É esta frase que abre a conversa comercial."
            placeholder="Ex.: quem procura o restaurante no celular não encontra cardápio atualizado nem telefone."
          />
          <FormGrid>
            <TextField
              label="Tempo estimado (horas)"
              type="number"
              min={0}
              step={1}
              value={form.estimatedHours}
              onChange={(value) => set('estimatedHours', value)}
              hint="Some execução, revisões e reuniões. Subestimar aqui é o erro mais caro do serviço."
            />
            <SelectField
              label="Situação"
              value={form.status}
              onChange={(value) => set('status', value)}
              options={[
                { value: 'rascunho', label: 'Rascunho' },
                { value: 'pronto', label: 'Pronto para ofertar' },
              ]}
            />
          </FormGrid>
        </div>
      </Panel>

      <Panel>
        <div className="panel-body stack">
          <SectionHeader title="Escopo" description="Entregável é o que o cliente recebe; etapa é como você chega lá." />
          <ListField
            label="Entregáveis"
            items={form.deliverables}
            onChange={(items) => set('deliverables', items)}
            placeholder="Ex.: página publicada e responsiva"
          />
          <ListField
            label="Etapas de execução"
            items={form.steps}
            onChange={(items) => set('steps', items)}
            placeholder="Ex.: briefing com o cliente"
          />
          <ListField
            label="Ferramentas"
            items={form.tools}
            onChange={(items) => set('tools', items)}
            placeholder="Ex.: construtor de sites"
            hint="Ferramenta paga é custo: decida na proposta se entra no preço ou é assinatura do cliente."
          />
          <ListField
            label="Riscos e limitações"
            items={form.risks}
            onChange={(items) => set('risks', items)}
            placeholder="Ex.: cliente sem fotos próprias"
            hint="Risco escrito agora é conversa fácil depois. Risco escondido vira retrabalho de graça."
          />
        </div>
      </Panel>

      <div className="editor-actions">
        <Button icon="check" onClick={() => void save()}>
          {saved ? 'Salvar alterações' : 'Salvar serviço'}
        </Button>
        {saved && form.status === 'rascunho' && (
          <Button variant="secondary" icon="check" onClick={() => void save('pronto')}>
            Marcar como pronto
          </Button>
        )}
        {saved && (
          <Button
            variant="secondary"
            icon="offer"
            onClick={() => navigate(`/ofertas/nova?blueprint=${saved.id}`)}
          >
            Gerar oferta
          </Button>
        )}
        {saved &&
          (confirmingDelete ? (
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
          ))}
      </div>
    </div>
  )
}
