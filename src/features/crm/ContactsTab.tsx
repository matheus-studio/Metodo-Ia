import { useState } from 'react'
import { FormGrid, SelectField, TextAreaField, TextField } from '@/components/form'
import { Button, EmptyState, Icon, Notice, Panel, SectionHeader } from '@/components/ui'
import { logActivity, repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import type { CompanyLead, Contact } from '@/types/domain'
import { safeTelHref } from '@/utils/url'

const EMPTY = { name: '', companyId: '', phone: '', email: '', role: '', notes: '' }

export function ContactsTab({ contacts, companies }: { contacts: Contact[]; companies: CompanyLead[] }) {
  const [form, setForm] = useState(EMPTY)
  const [creating, setCreating] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  async function create() {
    if (form.name.trim().length < 2) return
    const created = await repositories.contacts.create({
      name: form.name.trim(),
      companyId: form.companyId || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      role: form.role.trim() || undefined,
      notes: form.notes.trim() || undefined,
    })
    await logActivity({ kind: 'contato-registrado', message: `Contato cadastrado: ${created.name}.`, refId: created.id })
    dataBus.emit()
    setForm(EMPTY)
    setCreating(false)
  }

  async function remove(id: string) {
    await repositories.contacts.remove(id)
    dataBus.emit()
    setConfirmingDelete(null)
  }

  return (
    <div className="stack">
      <Panel tone="flat">
        <div className="panel-body stack">
          <SectionHeader
            title="Contatos"
            description="Pessoas com quem você fala. Guarde o mínimo necessário para retomar a conversa."
            action={
              <Button size="sm" icon="plus" onClick={() => setCreating((value) => !value)}>
                Novo contato
              </Button>
            }
          />

          {creating && (
            <div className="stack crm__form">
              <FormGrid>
                <TextField
                  label="Nome"
                  required
                  value={form.name}
                  onChange={(value) => setForm({ ...form, name: value })}
                />
                <TextField
                  label="Função"
                  value={form.role}
                  onChange={(value) => setForm({ ...form, role: value })}
                  placeholder="Ex.: proprietário"
                />
                <TextField
                  label="Telefone"
                  type="tel"
                  value={form.phone}
                  onChange={(value) => setForm({ ...form, phone: value })}
                />
                <TextField
                  label="E-mail"
                  type="email"
                  value={form.email}
                  onChange={(value) => setForm({ ...form, email: value })}
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
              </FormGrid>
              <TextAreaField
                label="Notas"
                rows={2}
                value={form.notes}
                onChange={(value) => setForm({ ...form, notes: value })}
              />
              <div className="row">
                <Button icon="check" onClick={() => void create()}>
                  Salvar contato
                </Button>
                <Button variant="ghost" onClick={() => setCreating(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <Notice>
            Dados de contato são dados pessoais. Guarde o que você precisa para trabalhar, registre de onde veio e
            apague quando não fizer mais sentido manter.
          </Notice>
        </div>
      </Panel>

      {contacts.length === 0 ? (
        <Panel>
          <EmptyState icon="message" title="Nenhum contato" text="Cadastre quem você já conhece para começar a usar a prospecção." />
        </Panel>
      ) : (
        <ul className="record-list">
          {contacts.map((contact) => {
            const company = companies.find((item) => item.id === contact.companyId)
            return (
              <li key={contact.id} className="record-card">
                <div className="record-card__main">
                  <h3 className="record-card__title">{contact.name}</h3>
                  <p className="record-card__meta">
                    {[contact.role, company?.name].filter(Boolean).join(' · ') || 'Sem vínculo'}
                  </p>
                  <p className="record-card__meta">
                    {[contact.phone, contact.email].filter(Boolean).join(' · ') || 'Sem dados de contato'}
                  </p>
                  {contact.notes && <p className="deal-card__notes">{contact.notes}</p>}
                </div>
                <div className="record-card__actions">
                  {safeTelHref(contact.phone) && (
                    <a
                      className="icon-button"
                      href={safeTelHref(contact.phone) ?? undefined}
                      aria-label={`Ligar para ${contact.name}`}
                    >
                      <Icon name="message" size={16} />
                    </a>
                  )}
                  {confirmingDelete === contact.id ? (
                    <>
                      <Button size="sm" variant="danger" onClick={() => void remove(contact.id)}>
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
                      aria-label={`Excluir ${contact.name}`}
                      onClick={() => setConfirmingDelete(contact.id)}
                    >
                      Excluir
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
