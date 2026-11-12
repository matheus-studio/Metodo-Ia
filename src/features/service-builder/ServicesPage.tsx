import { Link } from 'react-router-dom'
import { Badge, EmptyState, Icon, LinkButton, Panel, SectionHeader } from '@/components/ui'
import { useCollection } from '@/hooks/useCollection'
import { serviceByKey } from '@/features/catalog/catalogData'
import type { SavedOpportunity, ServiceBlueprint } from '@/types/domain'
import './service-builder.css'

export default function ServicesPage() {
  const { items: blueprints, status } = useCollection<ServiceBlueprint>('blueprints')
  const { items: opportunities } = useCollection<SavedOpportunity>('opportunities')

  const sorted = [...blueprints].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="services">
      <header className="page-intro">
        <h1>Seus serviços estruturados</h1>
        <p className="lede">
          Um serviço estruturado tem escopo, entregáveis, etapas e prazo. É o que separa uma proposta sólida de um
          orçamento improvisado — e é daqui que a oferta é gerada.
        </p>
        <div className="row">
          <LinkButton to="/servicos/novo" icon="plus">
            Novo serviço
          </LinkButton>
          <LinkButton to="/radar/servicos" variant="secondary" icon="radar">
            Partir do catálogo
          </LinkButton>
        </div>
      </header>

      {opportunities.length > 0 && blueprints.length === 0 && (
        <Panel tone="accent">
          <div className="panel-body stack">
            <SectionHeader
              title="Oportunidades salvas esperando escopo"
              description="Transforme uma delas em serviço estruturado — o conteúdo do catálogo já entra preenchido."
            />
            <ul className="services__suggestions">
              {opportunities.slice(0, 5).map((opportunity) => (
                <li key={opportunity.id}>
                  <Link to={`/servicos/novo?catalogo=${opportunity.serviceKey}`} className="services__suggestion">
                    <Icon name="blueprint" size={16} />
                    <span>{opportunity.title}</span>
                    <Icon name="chevron-right" size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      )}

      {status === 'pronto' && sorted.length === 0 ? (
        <Panel>
          <EmptyState
            icon="blueprint"
            title="Nenhum serviço estruturado ainda"
            text="Comece pelo catálogo para aproveitar escopo, etapas e riscos já descritos, ou crie do zero se o serviço for seu."
            action={<LinkButton to="/radar/servicos" variant="secondary">Explorar catálogo</LinkButton>}
          />
        </Panel>
      ) : (
        <ul className="services__grid">
          {sorted.map((blueprint, index) => {
            const origin = blueprint.catalogKey ? serviceByKey(blueprint.catalogKey) : undefined
            return (
              <li
                key={blueprint.id}
                className="service-card animate-rise"
                style={{ '--stagger-index': Math.min(index, 8) } as React.CSSProperties}
              >
                <div className="row row--between">
                  <Badge tone={blueprint.status === 'pronto' ? 'success' : 'neutral'} dot>
                    {blueprint.status === 'pronto' ? 'Pronto' : 'Rascunho'}
                  </Badge>
                  <span className="muted service-card__hours tabular">{blueprint.estimatedHours} h</span>
                </div>
                <h3 className="service-card__title">
                  <Link to={`/servicos/${blueprint.id}`}>{blueprint.name}</Link>
                </h3>
                <p className="service-card__problem">{blueprint.problem}</p>
                <p className="service-card__meta">
                  {blueprint.deliverables.length} entregáveis · {blueprint.steps.length} etapas
                  {origin ? ` · base: ${origin.name}` : ''}
                </p>
                <div className="service-card__actions">
                  <Link to={`/servicos/${blueprint.id}`} className="catalog-card__link">
                    Editar <Icon name="chevron-right" size={14} />
                  </Link>
                  <Link to={`/ofertas/nova?blueprint=${blueprint.id}`} className="catalog-card__link">
                    Gerar oferta <Icon name="arrow-right" size={14} />
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
