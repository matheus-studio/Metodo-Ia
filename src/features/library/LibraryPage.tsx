import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge, Button, EmptyState, Icon, LinkButton, Notice, Panel, SectionHeader } from '@/components/ui'
import { composePrompt } from '@/features/studio/promptBuilder'
import {
  LIBRARY,
  LIBRARY_CATEGORY_LABELS,
  MATERIAL_TYPE_LABELS,
  materialByKey,
} from './libraryData'
import type { LibraryCategory, MaterialType } from './libraryData'
import './library.css'

const CATEGORIES = Object.keys(LIBRARY_CATEGORY_LABELS) as LibraryCategory[]
const TYPES = Object.keys(MATERIAL_TYPE_LABELS) as MaterialType[]

function materialText(key: string): string {
  const material = materialByKey(key)
  if (!material) return ''
  if (material.draft) {
    return composePrompt({ ...material.draft, title: material.title, category: material.category })
  }
  return material.body
}

export default function LibraryPage() {
  const [params, setParams] = useSearchParams()
  const openKey = params.get('material')
  const open = materialByKey(openKey ?? '')

  const [text, setText] = useState('')
  const [types, setTypes] = useState<MaterialType[]>([])
  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const results = useMemo(() => {
    const needle = text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
    return LIBRARY.filter((material) => {
      if (types.length > 0 && !types.includes(material.type)) return false
      if (categories.length > 0 && !categories.includes(material.category)) return false
      if (!needle) return true
      const haystack = `${material.title} ${material.whenToUse} ${material.body}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
      return haystack.includes(needle)
    })
  }, [text, types, categories])

  async function copyMaterial(key: string) {
    try {
      await navigator.clipboard.writeText(materialText(key))
      setCopied(key)
    } catch {
      setCopied(null)
    }
  }

  if (open) {
    const content = materialText(open.key)
    return (
      <div className="library">
        <button type="button" className="back-link" onClick={() => setParams({})}>
          <Icon name="chevron-right" size={14} />
          Voltar à biblioteca
        </button>

        <header className="page-intro">
          <div className="chip-row">
            <Badge tone="accent">{MATERIAL_TYPE_LABELS[open.type]}</Badge>
            <Badge tone="neutral">{LIBRARY_CATEGORY_LABELS[open.category]}</Badge>
          </div>
          <h1>{open.title}</h1>
          <p className="lede">{open.whenToUse}</p>
          <div className="row">
            <Button icon="message" onClick={() => void copyMaterial(open.key)}>
              {copied === open.key ? 'Copiado' : 'Copiar material'}
            </Button>
            {open.draft && (
              <LinkButton to={`/studio?material=${open.key}`} variant="secondary" icon="spark">
                Abrir no IA Studio
              </LinkButton>
            )}
          </div>
        </header>

        <Panel>
          <div className="panel-body stack">
            <SectionHeader title="Conteúdo" />
            <pre className="library__content">{content}</pre>
          </div>
        </Panel>

        {open.variables.length > 0 && (
          <Panel>
            <div className="panel-body stack">
              <SectionHeader title="Variáveis" description="Troque antes de usar." />
              <div className="chip-row">
                {open.variables.map((variable) => (
                  <Badge key={variable} tone="data">{`{{${variable}}}`}</Badge>
                ))}
              </div>
            </div>
          </Panel>
        )}

        <div className="library__columns">
          <Panel>
            <div className="panel-body stack">
              <SectionHeader title="Como usar bem" />
              <ul className="detail-list">
                {open.tips.map((tip) => (
                  <li key={tip}>
                    <Icon name="info" size={14} />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
          <Panel>
            <div className="panel-body stack">
              <SectionHeader title="Critérios de revisão" description="Confira antes de entregar ao cliente." />
              <ul className="detail-list">
                {open.reviewCriteria.map((criterion) => (
                  <li key={criterion}>
                    <Icon name="check" size={14} />
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </div>
      </div>
    )
  }

  return (
    <div className="library">
      <header className="page-intro">
        <h1>Material pronto para trabalhar</h1>
        <p className="lede">
          {LIBRARY.length} materiais com conteúdo completo: prompts estruturados, checklists de entrega, roteiros de
          conversa e modelos de documento. Nada de prompt de uma linha.
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
              placeholder="Buscar material"
              aria-label="Buscar na biblioteca"
            />
          </div>
          <div className="chip-row">
            {TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={types.includes(type) ? 'chip is-selected' : 'chip'}
                aria-pressed={types.includes(type)}
                onClick={() => setTypes(types.includes(type) ? types.filter((item) => item !== type) : [...types, type])}
              >
                {MATERIAL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
          <div className="chip-row">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={categories.includes(category) ? 'chip is-selected' : 'chip'}
                aria-pressed={categories.includes(category)}
                onClick={() =>
                  setCategories(
                    categories.includes(category)
                      ? categories.filter((item) => item !== category)
                      : [...categories, category],
                  )
                }
              >
                {LIBRARY_CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {results.length === 0 ? (
        <Panel>
          <EmptyState icon="book" title="Nenhum material com esses filtros" text="Tente outro termo ou remova um filtro." />
        </Panel>
      ) : (
        <ul className="library__grid">
          {results.map((material, index) => (
            <li
              key={material.key}
              className="library-card animate-rise"
              style={{ '--stagger-index': Math.min(index, 8) } as React.CSSProperties}
            >
              <div className="chip-row">
                <Badge tone="accent">{MATERIAL_TYPE_LABELS[material.type]}</Badge>
                <Badge tone="neutral">{LIBRARY_CATEGORY_LABELS[material.category]}</Badge>
              </div>
              <h3 className="catalog-card__title">
                <Link to={`/biblioteca?material=${material.key}`}>{material.title}</Link>
              </h3>
              <p className="catalog-card__summary">{material.whenToUse}</p>
              <div className="catalog-card__actions">
                <Link to={`/biblioteca?material=${material.key}`} className="catalog-card__link">
                  Abrir <Icon name="chevron-right" size={14} />
                </Link>
                {material.draft && (
                  <Link to={`/studio?material=${material.key}`} className="catalog-card__link">
                    No Studio <Icon name="arrow-right" size={14} />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Notice>
        Esta é a coleção inicial, completa e revisada. Ampliar sem perder esse padrão é melhor do que encher a lista com
        material raso — o valor aqui está na profundidade de cada peça, não na contagem.
      </Notice>
    </div>
  )
}
