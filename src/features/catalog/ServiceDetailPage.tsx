import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePreferences } from '@/app/preferencesContext'
import { Badge, Button, Icon, LinkButton, Notice, Panel, SectionHeader } from '@/components/ui'
import { useCollection } from '@/hooks/useCollection'
import { logActivity, repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import { CATEGORY_LABELS, COMPLEXITY_LABELS } from '@/types/catalog'
import type { SavedOpportunity } from '@/types/domain'
import { serviceByKey } from './catalogData'
import { assessFit, FIT_LABELS } from './catalogFilters'
import { NotFoundPage } from '@/components/NotFoundPage'
import './catalog.css'

function List({ items, icon = 'check' }: { items: string[]; icon?: 'check' | 'alert' }) {
  return (
    <ul className="detail-list">
      {items.map((item) => (
        <li key={item}>
          <Icon name={icon} size={14} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ServiceDetailPage() {
  const { key = '' } = useParams()
  const service = serviceByKey(key)
  const { preferences } = usePreferences()
  const { items: saved } = useCollection<SavedOpportunity>('opportunities')

  const fit = useMemo(() => (service ? assessFit(service, preferences) : null), [service, preferences])
  const savedEntry = saved.find((item) => item.serviceKey === key)

  if (!service || !fit) return <NotFoundPage />

  async function toggleSave() {
    if (!service) return
    if (savedEntry) {
      await repositories.opportunities.remove(savedEntry.id)
    } else {
      await repositories.opportunities.create({ serviceKey: service.key, title: service.name })
      await logActivity({ kind: 'oportunidade-salva', message: `Oportunidade salva: ${service.name}.` })
    }
    dataBus.emit()
  }

  return (
    <div className="service-detail">
      <Link to="/radar/servicos" className="back-link">
        <Icon name="chevron-right" size={14} />
        Voltar ao catálogo
      </Link>

      <header className="service-detail__head">
        <div className="chip-row">
          <Badge tone="neutral">{CATEGORY_LABELS[service.category]}</Badge>
          <Badge tone="data">{COMPLEXITY_LABELS[service.complexity]}</Badge>
          <Badge tone="neutral">
            {service.hours[0]}–{service.hours[1]} horas
          </Badge>
        </div>
        <h1>{service.name}</h1>
        <p className="lede">{service.summary}</p>

        <div className="service-detail__actions">
          <Button variant={savedEntry ? 'secondary' : 'primary'} icon={savedEntry ? 'check' : 'plus'} onClick={() => void toggleSave()}>
            {savedEntry ? 'Oportunidade salva' : 'Salvar oportunidade'}
          </Button>
          <LinkButton to={`/servicos/novo?catalogo=${service.key}`} variant="secondary" icon="blueprint">
            Construir serviço
          </LinkButton>
          <LinkButton to={`/prospeccao?servico=${service.key}`} variant="ghost" icon="message">
            Preparar abordagem
          </LinkButton>
        </div>
      </header>

      <Panel tone="accent">
        <div className="panel-body stack">
          <SectionHeader title="Esse serviço combina com você?" />
          <div className="row">
            <Badge tone={fit.level === 'compativel' ? 'success' : fit.level === 'parcial' ? 'data' : 'danger'} dot>
              {FIT_LABELS[fit.level]}
            </Badge>
          </div>
          <ul className="detail-list detail-list--plain">
            {fit.notes.map((note) => (
              <li key={note}>
                <Icon name="info" size={14} />
                <span>{note}</span>
              </li>
            ))}
          </ul>
          <p className="muted catalog__disclaimer">
            Esta leitura compara o serviço com as habilidades que você cadastrou. O aplicativo não estima demanda nem
            faturamento: sem metodologia válida, um número desses seria chute apresentado como fato.
          </p>
        </div>
      </Panel>

      <div className="service-detail__columns">
        <Panel>
          <div className="panel-body stack">
            <SectionHeader title="Problema que resolve" />
            <p className="secondary">{service.problem}</p>
            <hr className="hairline" />
            <h3 className="detail-subtitle">Público</h3>
            <p className="secondary">{service.audience}</p>
            <h3 className="detail-subtitle">Segmentos onde costuma caber</h3>
            <div className="chip-row">
              {service.segments.map((segment) => (
                <Badge key={segment} tone="neutral">
                  {segment}
                </Badge>
              ))}
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="panel-body stack">
            <SectionHeader title="Entregáveis" />
            <List items={service.deliverables} />
            <hr className="hairline" />
            <h3 className="detail-subtitle">Ferramentas</h3>
            <div className="chip-row">
              {service.tools.map((tool) => (
                <Badge key={tool} tone="neutral">
                  {tool}
                </Badge>
              ))}
            </div>
            <h3 className="detail-subtitle">Habilidades necessárias</h3>
            <div className="chip-row">
              {service.skills.map((skill) => (
                <Badge key={skill} tone={fit.matchedSkills.includes(skill) ? 'success' : 'neutral'}>
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="panel-body stack">
          <SectionHeader title="Plano de execução" description="Ordem sugerida — ajuste ao seu jeito de trabalhar." />
          <ol className="detail-steps">
            {service.plan.map((step, index) => (
              <li key={step}>
                <span className="detail-steps__number tabular">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </Panel>

      <div className="service-detail__columns">
        <Panel>
          <div className="panel-body stack">
            <SectionHeader title="Modelos de cobrança" description="Como se cobra. Quanto cobrar é decisão sua." />
            <ul className="detail-list detail-list--plain">
              {service.pricing.map((model) => (
                <li key={model.label}>
                  <Icon name="calculator" size={14} />
                  <span>
                    <strong>{model.label}.</strong> {model.note}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel>
          <div className="panel-body stack">
            <SectionHeader title="Riscos conhecidos" description="O que costuma dar errado neste tipo de trabalho." />
            <List items={service.risks} icon="alert" />
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="panel-body stack">
          <SectionHeader
            title="Abordagem sugerida"
            description="Ponto de partida para você editar. Nada é enviado automaticamente."
          />
          <blockquote className="pitch-quote">{service.pitch}</blockquote>
          <Notice>
            Trechos entre chaves, como <strong>{'{segmento}'}</strong>, são para você substituir por informação que
            tenha verificado. Nunca afirme algo sobre o cliente que você não confirmou.
          </Notice>
          <div className="row">
            <LinkButton to={`/prospeccao?servico=${service.key}`} variant="secondary" iconEnd="arrow-right">
              Abrir na prospecção
            </LinkButton>
          </div>
        </div>
      </Panel>
    </div>
  )
}
