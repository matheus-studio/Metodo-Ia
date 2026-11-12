import { useState } from 'react'
import { FormGrid, SelectField, TextAreaField, TextField } from '@/components/form'
import { Badge, Button, EmptyState, Notice, Panel, SectionHeader } from '@/components/ui'
import { logActivity, repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import type { CompanyLead, DigitalPresence } from '@/types/domain'
import { displayUrl, safeExternalUrl } from '@/utils/url'

const PRESENCE_LABELS: Record<DigitalPresence, string> = {
  'site-identificado': 'Site identificado',
  'site-nao-cadastrado': 'Site não cadastrado na fonte',
  'site-nao-confirmado': 'Site não confirmado',
  'presenca-verificada': 'Presença digital verificada',
}

const PRESENCE_HELP: Record<DigitalPresence, string> = {
  'site-identificado': 'Você viu o endereço do site.',
  'site-nao-cadastrado': 'A fonte consultada não trazia site. Isso não prova que a empresa não tenha um.',
  'site-nao-confirmado': 'Informação insuficiente — ainda não dá para afirmar nada.',
  'presenca-verificada': 'Você verificou pessoalmente e registrou a evidência.',
}

const EMPTY = {
  name: '',
  segment: '',
  city: '',
  address: '',
  phone: '',
  website: '',
  digitalPresence: 'site-nao-confirmado' as DigitalPresence,
  notes: '',
}

export function CompaniesTab({ companies }: { companies: CompanyLead[] }) {
  const [form, setForm] = useState(EMPTY)
  const [creating, setCreating] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  async function create() {
    if (form.name.trim().length < 2) return
    const created = await repositories.companies.create({
      name: form.name.trim(),
      segment: form.segment.trim() || 'Não informado',
      city: form.city.trim() || 'Não informada',
      address: form.address.trim() || undefined,
      phone: form.phone.trim() || undefined,
      // Saneado também na gravação: o backup exportado não leva lixo adiante.
      website: safeExternalUrl(form.website) ?? undefined,
      digitalPresence: form.digitalPresence,
      source: 'manual',
      checkedAt: new Date().toISOString(),
      notes: form.notes.trim() || undefined,
    })
    await logActivity({ kind: 'empresa-registrada', message: `Empresa cadastrada: ${created.name}.`, refId: created.id })
    dataBus.emit()
    setForm(EMPTY)
    setCreating(false)
  }

  async function remove(id: string) {
    await repositories.companies.remove(id)
    dataBus.emit()
    setConfirmingDelete(null)
  }

  return (
    <div className="stack">
      <Panel tone="flat">
        <div className="panel-body stack">
          <SectionHeader
            title="Empresas"
            description="Cadastro manual dos negócios que você já conhece ou visitou."
            action={
              <Button size="sm" icon="plus" onClick={() => setCreating((value) => !value)}>
                Nova empresa
              </Button>
            }
          />

          {creating && (
            <div className="stack crm__form">
              <FormGrid>
                <TextField label="Nome" required value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                <TextField
                  label="Segmento"
                  value={form.segment}
                  onChange={(value) => setForm({ ...form, segment: value })}
                  placeholder="Ex.: Alimentação"
                />
                <TextField label="Cidade" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
                <TextField
                  label="Telefone"
                  type="tel"
                  value={form.phone}
                  onChange={(value) => setForm({ ...form, phone: value })}
                />
                <TextField
                  label="Site"
                  type="url"
                  value={form.website}
                  onChange={(value) => setForm({ ...form, website: value })}
                  placeholder="https://"
                />
                <SelectField
                  label="Presença digital"
                  value={form.digitalPresence}
                  onChange={(value) => setForm({ ...form, digitalPresence: value })}
                  options={(Object.keys(PRESENCE_LABELS) as DigitalPresence[]).map((key) => ({
                    value: key,
                    label: PRESENCE_LABELS[key],
                  }))}
                  hint={PRESENCE_HELP[form.digitalPresence]}
                />
              </FormGrid>
              <TextField
                label="Endereço"
                value={form.address}
                onChange={(value) => setForm({ ...form, address: value })}
              />
              <TextAreaField
                label="Notas"
                rows={2}
                value={form.notes}
                onChange={(value) => setForm({ ...form, notes: value })}
                hint="Registre o que você observou e quando. Observação datada vale mais que memória."
              />
              <div className="row">
                <Button icon="check" onClick={() => void create()}>
                  Salvar empresa
                </Button>
                <Button variant="ghost" onClick={() => setCreating(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <Notice tone="warning">
            <strong>Sobre "não tem site":</strong> enquanto você não verificar, a classificação correta é{' '}
            <em>não confirmado</em>. A busca automática em fonte autorizada chega no Marco 3 — e mesmo lá, ausência na
            base nunca significará ausência de site. <Badge tone="neutral">Marco 3</Badge>
          </Notice>
        </div>
      </Panel>

      {companies.length === 0 ? (
        <Panel>
          <EmptyState
            icon="building"
            title="Nenhuma empresa cadastrada"
            text="Cadastre os negócios que você já conhece. A busca por fonte autorizada entra no Marco 3."
          />
        </Panel>
      ) : (
        <ul className="record-list">
          {companies.map((company) => (
            <li key={company.id} className="record-card">
              <div className="record-card__main">
                <div className="chip-row">
                  <Badge
                    tone={
                      company.digitalPresence === 'site-identificado' || company.digitalPresence === 'presenca-verificada'
                        ? 'success'
                        : company.digitalPresence === 'site-nao-cadastrado'
                          ? 'accent'
                          : 'neutral'
                    }
                  >
                    {PRESENCE_LABELS[company.digitalPresence]}
                  </Badge>
                  {company.source === 'manual' && <Badge tone="neutral">Cadastro manual</Badge>}
                </div>
                <h3 className="record-card__title">{company.name}</h3>
                <p className="record-card__meta">
                  {[company.segment, company.city].filter(Boolean).join(' · ')}
                </p>
                <p className="record-card__meta">
                  {[company.phone, displayUrl(company.website)].filter(Boolean).join(' · ') ||
                    'Sem contato registrado'}
                </p>
                {company.notes && <p className="deal-card__notes">{company.notes}</p>}
              </div>
              <div className="record-card__actions">
                {/* Só http/https chegam ao href: ver utils/url.ts. */}
                {safeExternalUrl(company.website) && (
                  <a
                    className="catalog-card__link"
                    href={safeExternalUrl(company.website) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    Abrir site
                  </a>
                )}
                {confirmingDelete === company.id ? (
                  <>
                    <Button size="sm" variant="danger" onClick={() => void remove(company.id)}>
                      Confirmar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(null)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon="trash"
                    aria-label={`Excluir ${company.name}`}
                    onClick={() => setConfirmingDelete(company.id)}
                  >
                    Excluir
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
