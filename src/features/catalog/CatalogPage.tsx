import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState, Icon, Panel, SectionHeader } from '@/components/ui'
import { useCollection } from '@/hooks/useCollection'
import { logActivity, repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import { CATEGORY_LABELS, COMPLEXITY_LABELS } from '@/types/catalog'
import type { CatalogCategory, Complexity } from '@/types/catalog'
import type { SavedOpportunity } from '@/types/domain'
import { CATALOG } from './catalogData'
import { catalogSegments, filterCatalog } from './catalogFilters'
import './catalog.css'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as CatalogCategory[]
const COMPLEXITIES = Object.keys(COMPLEXITY_LABELS) as Complexity[]

export default function CatalogPage() {
  const [text, setText] = useState('')
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [complexities, setComplexities] = useState<Complexity[]>([])
  const [segment, setSegment] = useState('')

  const { items: saved } = useCollection<SavedOpportunity>('opportunities')
  const savedKeys = useMemo(() => new Set(saved.map((item) => item.serviceKey)), [saved])

  const results = useMemo(
    () => filterCatalog(CATALOG, { text, categories, complexities, segment }),
    [text, categories, complexities, segment],
  )

  const segments = useMemo(() => catalogSegments(CATALOG), [])

  function toggle<T>(list: T[], value: T, setter: (next: T[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }

  async function toggleSave(key: string, name: string) {
    const existing = saved.find((item) => item.serviceKey === key)
    if (existing) {
      await repositories.opportunities.remove(existing.id)
    } else {
      await repositories.opportunities.create({ serviceKey: key, title: name })
      await logActivity({ kind: 'oportunidade-salva', message: `Oportunidade salva: ${name}.` })
    }
    dataBus.emit()
  }

  const hasFilters = text !== '' || categories.length > 0 || complexities.length > 0 || segment !== ''

  return (
    <div className="catalog">
      <header className="catalog__intro">
        <h1>O que você pode vender</h1>
        <p className="lede">
          {CATALOG.length} serviços com escopo, entregáveis, ferramentas, riscos e plano de execução. Salve os que fazem
          sentido para você — eles alimentam o próximo passo do painel e o construtor de serviços.
        </p>
      </header>

      <Panel tone="flat">
        <div className="panel-body stack">
          <div className="catalog__search">
            <Icon name="search" size={18} />
            <input
              type="search"
              className="catalog__search-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Buscar por serviço, problema, entregável ou ferramenta"
              aria-label="Buscar no catálogo"
            />
          </div>

          <div className="stack">
            <p className="eyebrow">Categoria</p>
            <div className="chip-row">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={categories.includes(category) ? 'chip is-selected' : 'chip'}
                  aria-pressed={categories.includes(category)}
                  onClick={() => toggle(categories, category, setCategories)}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
          </div>

          <div className="catalog__filters-row">
            <div className="stack">
              <p className="eyebrow">Complexidade</p>
              <div className="chip-row">
                {COMPLEXITIES.map((complexity) => (
                  <button
                    key={complexity}
                    type="button"
                    className={complexities.includes(complexity) ? 'chip is-selected' : 'chip'}
                    aria-pressed={complexities.includes(complexity)}
                    onClick={() => toggle(complexities, complexity, setComplexities)}
                  >
                    {COMPLEXITY_LABELS[complexity]}
                  </button>
                ))}
              </div>
            </div>

            <div className="field catalog__segment">
              <label className="field__label" htmlFor="catalogo-segmento">
                Segmento do cliente
              </label>
              <select
                id="catalogo-segmento"
                className="field__input"
                value={segment}
                onChange={(event) => setSegment(event.target.value)}
              >
                <option value="">Todos os segmentos</option>
                {segments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasFilters && (
            <div className="row">
              <Button
                variant="ghost"
                size="sm"
                icon="close"
                onClick={() => {
                  setText('')
                  setCategories([])
                  setComplexities([])
                  setSegment('')
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </Panel>

      <SectionHeader
        title={`${results.length} ${results.length === 1 ? 'serviço' : 'serviços'}`}
        description={savedKeys.size > 0 ? `${savedKeys.size} salvo(s) como oportunidade.` : undefined}
      />

      {results.length === 0 ? (
        <Panel>
          <EmptyState
            icon="search"
            title="Nenhum serviço com esses filtros"
            text="Tente remover um filtro ou buscar pelo problema do cliente em vez do nome do serviço."
          />
        </Panel>
      ) : (
        <ul className="catalog__grid">
          {results.map((service, index) => {
            const isSaved = savedKeys.has(service.key)
            return (
              <li
                key={service.key}
                className="catalog-card animate-rise"
                style={{ '--stagger-index': Math.min(index, 8) } as React.CSSProperties}
              >
                <div className="catalog-card__head">
                  <Badge tone="neutral">{CATEGORY_LABELS[service.category]}</Badge>
                  <Badge tone={service.complexity === 'iniciante' ? 'success' : service.complexity === 'avancado' ? 'danger' : 'data'}>
                    {COMPLEXITY_LABELS[service.complexity]}
                  </Badge>
                </div>

                <h3 className="catalog-card__title">
                  <Link to={`/radar/servicos/${service.key}`}>{service.name}</Link>
                </h3>
                <p className="catalog-card__summary">{service.summary}</p>

                <p className="catalog-card__meta">
                  <Icon name="clock" size={14} />
                  <span className="tabular">
                    {service.hours[0]}–{service.hours[1]} h
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{service.deliverables.length} entregáveis</span>
                </p>

                <div className="catalog-card__actions">
                  <Button
                    size="sm"
                    variant={isSaved ? 'secondary' : 'primary'}
                    icon={isSaved ? 'check' : 'plus'}
                    onClick={() => void toggleSave(service.key, service.name)}
                  >
                    {isSaved ? 'Salvo' : 'Salvar'}
                  </Button>
                  <Link to={`/radar/servicos/${service.key}`} className="catalog-card__link">
                    Ver detalhes <Icon name="chevron-right" size={14} />
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
