import { Link } from 'react-router-dom'
import { Badge, EmptyState, Icon, LinkButton, Panel } from '@/components/ui'
import { useCollection } from '@/hooks/useCollection'
import type { Offer, OfferStatus, ServiceBlueprint } from '@/types/domain'
import { formatCurrency, offerGaps } from './offerDocument'
import './offers.css'

const STATUS_LABEL: Record<OfferStatus, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  aceita: 'Aceita',
  recusada: 'Recusada',
}

const STATUS_TONE: Record<OfferStatus, 'neutral' | 'data' | 'success' | 'danger'> = {
  rascunho: 'neutral',
  enviada: 'data',
  aceita: 'success',
  recusada: 'danger',
}

export default function OffersPage() {
  const { items: offers, status } = useCollection<Offer>('offers')
  const { items: blueprints } = useCollection<ServiceBlueprint>('blueprints')

  const sorted = [...offers].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="offers">
      <header className="page-intro">
        <h1>Suas propostas comerciais</h1>
        <p className="lede">
          Uma proposta completa responde antes o que o cliente perguntaria depois: o que entra, o que não entra, quanto
          custa, em quanto tempo e o que acontece a seguir.
        </p>
        <div className="row">
          <LinkButton to="/ofertas/nova" icon="plus">
            Nova oferta
          </LinkButton>
          {blueprints.length > 0 && (
            <LinkButton to="/servicos" variant="secondary" icon="blueprint">
              Partir de um serviço
            </LinkButton>
          )}
        </div>
      </header>

      {status === 'pronto' && sorted.length === 0 ? (
        <Panel>
          <EmptyState
            icon="offer"
            title="Nenhuma oferta criada"
            text={
              blueprints.length > 0
                ? 'Gere a partir de um serviço estruturado: escopo, entregáveis e prazo já entram preenchidos.'
                : 'Estruture um serviço primeiro — a oferta nasce dele com escopo e entregáveis prontos.'
            }
            action={
              <LinkButton to={blueprints.length > 0 ? '/servicos' : '/radar/servicos'} variant="secondary">
                {blueprints.length > 0 ? 'Ver meus serviços' : 'Explorar catálogo'}
              </LinkButton>
            }
          />
        </Panel>
      ) : (
        <ul className="offers__grid">
          {sorted.map((offer, index) => {
            const gaps = offerGaps(offer)
            return (
              <li
                key={offer.id}
                className="offer-card animate-rise"
                style={{ '--stagger-index': Math.min(index, 8) } as React.CSSProperties}
              >
                <div className="row row--between">
                  <Badge tone={STATUS_TONE[offer.status]} dot>
                    {STATUS_LABEL[offer.status]}
                  </Badge>
                  {offer.price !== undefined && (
                    <span className="offer-card__price tabular">{formatCurrency(offer.price)}</span>
                  )}
                </div>
                <h3 className="service-card__title">
                  <Link to={`/ofertas/${offer.id}`}>{offer.name}</Link>
                </h3>
                <p className="service-card__meta">{offer.clientOrSegment || 'Cliente não definido'}</p>
                <p className="service-card__meta">
                  {offer.deliverables.length} entregáveis
                  {offer.deadlineDays !== undefined ? ` · ${offer.deadlineDays} dias` : ''}
                </p>
                {gaps.length > 0 && (
                  <p className="offer-card__gaps">
                    <Icon name="alert" size={14} />
                    {gaps.length} ponto(s) a completar
                  </p>
                )}
                <div className="service-card__actions">
                  <Link to={`/ofertas/${offer.id}`} className="catalog-card__link">
                    Abrir <Icon name="chevron-right" size={14} />
                  </Link>
                  <Link to={`/prospeccao?oferta=${offer.id}`} className="catalog-card__link">
                    Abordar <Icon name="arrow-right" size={14} />
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
