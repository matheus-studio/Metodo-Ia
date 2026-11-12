import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePreferences } from '@/app/preferencesContext'
import { FormGrid, SelectField, TextAreaField, TextField } from '@/components/form'
import { Badge, Button, Icon, Notice, Panel, SectionHeader } from '@/components/ui'
import { HelpTerm } from '@/components/HelpTerm'
import { serviceByKey } from '@/features/catalog/catalogData'
import { useCollection } from '@/hooks/useCollection'
import { logActivity, repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import type { CompanyLead, Contact, Deal, Offer } from '@/types/domain'
import {
  buildMessage,
  CHANNEL_LABELS,
  OBJECTION_LABELS,
  TONE_LABELS,
  whatsappLink,
} from './messageTemplates'
import type { Channel, ObjectionKey, Tone } from './messageTemplates'
import './prospecting.css'

const CHANNELS = Object.keys(CHANNEL_LABELS) as Channel[]
const TONES = Object.keys(TONE_LABELS) as Tone[]
const OBJECTIONS = Object.keys(OBJECTION_LABELS) as ObjectionKey[]

export default function ProspectingPage() {
  const [params] = useSearchParams()
  const { preferences } = usePreferences()

  const { items: contacts } = useCollection<Contact>('contacts')
  const { items: companies } = useCollection<CompanyLead>('companies')
  const { items: offers } = useCollection<Offer>('offers')
  const { items: deals } = useCollection<Deal>('deals')

  const [channel, setChannel] = useState<Channel>('whatsapp')
  const [tone, setTone] = useState<Tone>('consultivo')
  const [objection, setObjection] = useState<ObjectionKey>('preco')
  const [contactId, setContactId] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [offerId, setOfferId] = useState(params.get('oferta') ?? '')
  // Serviço vindo do catálogo pela URL (botão "Preparar abordagem").
  const seed = serviceByKey(params.get('servico') ?? '')
  const [serviceName, setServiceName] = useState(() => (seed ? seed.name.toLowerCase() : ''))
  const [benefit, setBenefit] = useState(() => (seed ? seed.summary.toLowerCase().replace(/\.$/, '') : ''))
  const [observation, setObservation] = useState('')
  // null = ainda não editado à mão, então vale o telefone do contato/empresa.
  // String vazia é edição deliberada: o campo precisa poder ser limpo.
  const [phone, setPhone] = useState<string | null>(null)
  /** Texto digitado pelo usuário. Enquanto for null, vale o texto gerado. */
  const [manualDraft, setManualDraft] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!offerId) return
    const offer = offers.find((item) => item.id === offerId)
    if (offer && serviceName === '') setServiceName(offer.name.toLowerCase())
  }, [offerId, offers, serviceName])

  const contact = contacts.find((item) => item.id === contactId)
  const company = companies.find((item) => item.id === companyId) ?? companies.find((item) => item.id === contact?.companyId)
  const offer = offers.find((item) => item.id === offerId)

  const context = useMemo(
    () => ({
      senderName: preferences.displayName,
      contactName: contact?.name,
      companyName: company?.name,
      serviceName,
      benefit,
      verifiedObservation: observation,
      offerName: offer?.name,
      objection,
    }),
    [preferences.displayName, contact, company, serviceName, benefit, observation, offer, objection],
  )

  const generated = useMemo(() => buildMessage(channel, tone, context), [channel, tone, context])

  // Derivado, não sincronizado: enquanto não houver edição manual, o rascunho
  // é o texto gerado e acompanha cada escolha sem um efeito no meio.
  const edited = manualDraft !== null
  const draft = manualDraft ?? generated.body

  const effectivePhone = phone ?? contact?.phone ?? company?.phone ?? ''
  const waLink = effectivePhone ? whatsappLink(effectivePhone, draft) : null

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(generated.subject ? `${generated.subject}\n\n${draft}` : draft)
      setFeedback('Mensagem copiada. Revise antes de enviar.')
    } catch {
      setFeedback('O navegador bloqueou a cópia — selecione o texto e copie manualmente.')
    }
  }

  async function registerApproach() {
    const title = company?.name
      ? `${company.name} — ${serviceName || 'abordagem'}`
      : contact?.name
        ? `${contact.name} — ${serviceName || 'abordagem'}`
        : `Abordagem — ${serviceName || 'serviço'}`

    const existing = deals.find(
      (deal) => (companyId && deal.companyId === companyId) || (contactId && deal.contactId === contactId),
    )

    if (existing) {
      await repositories.deals.update(existing.id, {
        stage: existing.stage === 'novo' ? 'contatado' : existing.stage,
        notes: `${existing.notes ? `${existing.notes}\n` : ''}[${new Date().toLocaleDateString('pt-BR')}] Abordagem por ${CHANNEL_LABELS[channel]}.`,
      })
      await logActivity({
        kind: 'negociacao-atualizada',
        message: `Abordagem registrada por ${CHANNEL_LABELS[channel]}: ${existing.title}.`,
        refId: existing.id,
      })
      setFeedback('Abordagem registrada na negociação existente.')
    } else {
      const created = await repositories.deals.create({
        title,
        stage: 'contatado',
        contactId: contactId || undefined,
        companyId: company?.id,
        offerId: offerId || undefined,
        notes: `[${new Date().toLocaleDateString('pt-BR')}] Primeira abordagem por ${CHANNEL_LABELS[channel]}.`,
      })
      await logActivity({
        kind: 'negociacao-atualizada',
        message: `Negociação aberta a partir de abordagem: ${created.title}.`,
        refId: created.id,
      })
      setFeedback('Negociação criada no CRM com a abordagem registrada.')
    }
    dataBus.emit()
  }

  return (
    <div className="prospecting">
      <header className="page-intro">
        <h1>Prepare a abordagem</h1>
        <p className="lede">
          O texto é montado com o que você informou e nada além disso. Revise, ajuste ao seu jeito de falar e envie você
          mesmo — o aplicativo não dispara mensagem nem faz envio em massa.
        </p>
      </header>

      {feedback && <Notice>{feedback}</Notice>}

      <Panel>
        <div className="panel-body stack">
          <SectionHeader title="Canal e tom" />
          <p className="secondary">
            O que é <HelpTerm termKey="prospeccao" label="prospecção" /> e quando fazer{' '}
            <HelpTerm termKey="follow-up" label="follow-up" />.
          </p>
          <div className="chip-row">
            {CHANNELS.map((item) => (
              <button
                key={item}
                type="button"
                className={channel === item ? 'chip is-selected' : 'chip'}
                aria-pressed={channel === item}
                onClick={() => {
                  setChannel(item)
                  setManualDraft(null)
                }}
              >
                {CHANNEL_LABELS[item]}
              </button>
            ))}
          </div>
          <div className="chip-row">
            {TONES.map((item) => (
              <button
                key={item}
                type="button"
                className={tone === item ? 'chip is-selected' : 'chip'}
                aria-pressed={tone === item}
                onClick={() => {
                  setTone(item)
                  setManualDraft(null)
                }}
              >
                {TONE_LABELS[item]}
              </button>
            ))}
          </div>
          {channel === 'objecao' && (
            <SelectField
              label="Objeção recebida"
              value={objection}
              onChange={(value) => {
                setObjection(value)
                setManualDraft(null)
              }}
              options={OBJECTIONS.map((item) => ({ value: item, label: OBJECTION_LABELS[item] }))}
            />
          )}
        </div>
      </Panel>

      <Panel>
        <div className="panel-body stack">
          <SectionHeader
            title="Contexto"
            description="Só o que você sabe. Campo em branco simplesmente não aparece na mensagem."
          />
          <FormGrid>
            <SelectField
              label="Contato"
              value={contactId}
              onChange={(value) => {
                setContactId(value)
                setManualDraft(null)
              }}
              options={[
                { value: '', label: contacts.length > 0 ? 'Sem contato específico' : 'Nenhum contato cadastrado' },
                ...contacts.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
            <SelectField
              label="Empresa"
              value={companyId}
              onChange={(value) => {
                setCompanyId(value)
                setManualDraft(null)
              }}
              options={[
                { value: '', label: companies.length > 0 ? 'Sem empresa específica' : 'Nenhuma empresa cadastrada' },
                ...companies.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
            <SelectField
              label="Oferta relacionada"
              value={offerId}
              onChange={(value) => {
                setOfferId(value)
                setManualDraft(null)
              }}
              options={[
                { value: '', label: offers.length > 0 ? 'Nenhuma' : 'Nenhuma oferta criada' },
                ...offers.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
            <TextField
              label="Serviço que você oferece"
              value={serviceName}
              onChange={(value) => {
                setServiceName(value)
                setManualDraft(null)
              }}
              placeholder="Ex.: criação de sites"
            />
          </FormGrid>
          <TextAreaField
            label="Benefício prático"
            rows={2}
            value={benefit}
            onChange={(value) => {
              setBenefit(value)
              setManualDraft(null)
            }}
            placeholder="Ex.: o cliente acha cardápio e telefone em segundos, sem precisar perguntar"
          />
          <TextAreaField
            label="Observação verificada sobre o negócio (opcional)"
            rows={2}
            value={observation}
            onChange={(value) => {
              setObservation(value)
              setManualDraft(null)
            }}
            hint="Escreva apenas o que você conferiu. Nunca afirme que a empresa não tem site sem ter verificado."
            placeholder="Ex.: vi que o cardápio do perfil está em foto de 2023"
          />
        </div>
      </Panel>

      <Panel tone="accent">
        <div className="panel-body stack">
          <SectionHeader
            title="Rascunho"
            description="Edite à vontade. Mudanças suas têm prioridade sobre o texto gerado."
            action={
              edited ? (
                <Button
                  size="sm"
                  variant="ghost"
                  icon="radar"
                  onClick={() => setManualDraft(null)}
                >
                  Regerar
                </Button>
              ) : undefined
            }
          />

          {generated.subject && (
            <div className="prospecting__subject">
              <span className="eyebrow">Assunto</span>
              <p>{generated.subject}</p>
            </div>
          )}

          <textarea
            className="field__input field__input--area prospecting__draft"
            value={draft}
            rows={10}
            maxLength={4000}
            aria-label="Mensagem de abordagem"
            onChange={(event) => setManualDraft(event.target.value)}
          />
          <p className="muted prospecting__count tabular">{draft.length} caracteres</p>

          {generated.warnings.length > 0 && (
            <Notice tone="warning">
              <ul className="bullets">
                {generated.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </Notice>
          )}
        </div>
      </Panel>

      <Panel>
        <div className="panel-body stack">
          <SectionHeader title="Enviar e registrar" description="O envio é seu. O registro é para você não perder o fio." />
          <FormGrid>
            <TextField
              label="Telefone para o WhatsApp"
              type="tel"
              value={effectivePhone}
              onChange={setPhone}
              placeholder="(41) 99999-0000"
              hint="Nem todo telefone comercial tem WhatsApp. O link abre a conversa; o envio continua manual."
            />
          </FormGrid>

          <div className="row prospecting__actions">
            <Button icon="message" onClick={() => void copyDraft()}>
              Copiar mensagem
            </Button>
            {waLink ? (
              <a className="btn btn--secondary btn--md" href={waLink} target="_blank" rel="noopener noreferrer">
                <Icon name="arrow-right" size={18} />
                <span className="btn__label">Abrir no WhatsApp</span>
              </a>
            ) : (
              <Button variant="secondary" icon="arrow-right" disabled>
                Abrir no WhatsApp
              </Button>
            )}
            <Button variant="secondary" icon="pipeline" onClick={() => void registerApproach()}>
              Registrar abordagem no CRM
            </Button>
          </div>

          {effectivePhone && !waLink && (
            <Notice tone="warning">
              O telefone informado não tem um formato plausível. Confira o número — abrir uma conversa errada é pior do
              que não abrir nenhuma.
            </Notice>
          )}

          <Notice>
            <strong>Sobre disparo em massa:</strong> o aplicativo não faz, e não vai fazer. Além de violar as regras das
            plataformas, queima o número e o nome de quem envia. <Badge tone="neutral">Uma mensagem por vez</Badge>
          </Notice>
        </div>
      </Panel>
    </div>
  )
}
