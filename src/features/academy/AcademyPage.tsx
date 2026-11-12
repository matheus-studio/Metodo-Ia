import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { moduleByKey } from '@/app/modules'
import { Badge, Icon, LinkButton, Panel, SectionHeader } from '@/components/ui'
import { GLOSSARY, LESSONS, TRACKS, lessonByKey, termByKey } from './academyData'
import type { TrackKey } from './academyData'
import './academy.css'

function ModuleLink({ moduleKey, label }: { moduleKey?: string; label?: string }) {
  const module = moduleKey ? moduleByKey(moduleKey) : undefined
  if (!module || module.status !== 'disponivel') return null
  return (
    <LinkButton to={module.path} variant="secondary" icon={module.icon}>
      {label ?? module.label}
    </LinkButton>
  )
}

export default function AcademyPage() {
  const [params, setParams] = useSearchParams()
  const lesson = lessonByKey(params.get('aula') ?? '')
  const [track, setTrack] = useState<TrackKey | 'glossario'>('ia')

  const lessonsByTrack = useMemo(
    () => (track === 'glossario' ? [] : LESSONS.filter((item) => item.track === track)),
    [track],
  )

  if (lesson) {
    const terms = lesson.terms.map(termByKey).filter((item) => item !== undefined)
    return (
      <div className="academy">
        <button type="button" className="back-link" onClick={() => setParams({})}>
          <Icon name="chevron-right" size={14} />
          Voltar à Academia
        </button>

        <header className="page-intro">
          <Badge tone="neutral">{TRACKS.find((item) => item.key === lesson.track)?.label}</Badge>
          <h1>{lesson.title}</h1>
          <p className="lede">{lesson.summary}</p>
        </header>

        <Panel>
          <div className="panel-body stack">
            {lesson.body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="academy__paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        </Panel>

        <div className="academy__columns">
          <Panel tone="accent">
            <div className="panel-body stack">
              <SectionHeader title="Na prática" />
              <p className="secondary">{lesson.example}</p>
              <ModuleLink moduleKey={lesson.moduleKey} label={lesson.moduleLabel} />
            </div>
          </Panel>

          <Panel>
            <div className="panel-body stack">
              <SectionHeader title="Erros comuns" />
              <ul className="detail-list">
                {lesson.mistakes.map((mistake) => (
                  <li key={mistake}>
                    <Icon name="alert" size={14} />
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        </div>

        {terms.length > 0 && (
          <Panel>
            <div className="panel-body stack">
              <SectionHeader title="Termos desta aula" />
              <ul className="academy__terms">
                {terms.map((term) => (
                  <li key={term.key}>
                    <p className="academy__term-name">{term.term}</p>
                    <p className="secondary">{term.definition}</p>
                    <p className="muted">Exemplo: {term.example}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        )}
      </div>
    )
  }

  return (
    <div className="academy">
      <header className="page-intro">
        <h1>Entender para decidir melhor</h1>
        <p className="lede">
          {LESSONS.length} aulas e {GLOSSARY.length} termos explicados. Cada aula muda alguma decisão que você toma
          dentro do próprio aplicativo — e aponta onde aplicar.
        </p>
      </header>

      <div className="crm__tabs" role="tablist" aria-label="Trilhas da Academia">
        {TRACKS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={track === item.key}
            className={track === item.key ? 'crm__tab is-active' : 'crm__tab'}
            onClick={() => setTrack(item.key)}
          >
            {item.label}
            <span className="crm__tab-count tabular">{LESSONS.filter((l) => l.track === item.key).length}</span>
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={track === 'glossario'}
          className={track === 'glossario' ? 'crm__tab is-active' : 'crm__tab'}
          onClick={() => setTrack('glossario')}
        >
          Glossário
          <span className="crm__tab-count tabular">{GLOSSARY.length}</span>
        </button>
      </div>

      {track === 'glossario' ? (
        <ul className="academy__glossary">
          {GLOSSARY.map((term) => (
            <li key={term.key} className="record-card">
              <div className="record-card__main">
                <h3 className="record-card__title">{term.term}</h3>
                <p className="secondary">{term.definition}</p>
                <p className="muted">Exemplo: {term.example}</p>
              </div>
              {term.moduleKey && (
                <div className="record-card__actions">
                  <ModuleLink moduleKey={term.moduleKey} label={term.moduleLabel} />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="secondary">{TRACKS.find((item) => item.key === track)?.summary}</p>
          <ul className="academy__list">
            {lessonsByTrack.map((item, index) => (
              <li
                key={item.key}
                className="academy-card animate-rise"
                style={{ '--stagger-index': Math.min(index, 8) } as React.CSSProperties}
              >
                <h3 className="catalog-card__title">
                  <Link to={`/academia?aula=${item.key}`}>{item.title}</Link>
                </h3>
                <p className="catalog-card__summary">{item.summary}</p>
                <div className="catalog-card__actions">
                  <Link to={`/academia?aula=${item.key}`} className="catalog-card__link">
                    Ler <Icon name="chevron-right" size={14} />
                  </Link>
                  {item.moduleKey && moduleByKey(item.moduleKey)?.status === 'disponivel' && (
                    <Link to={moduleByKey(item.moduleKey)?.path ?? '/'} className="catalog-card__link">
                      Aplicar <Icon name="arrow-right" size={14} />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
