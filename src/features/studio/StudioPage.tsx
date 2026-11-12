import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormGrid, ListField, SelectField, TextAreaField, TextField } from '@/components/form'
import { Badge, Button, EmptyState, Icon, Meter, Notice, Panel, SectionHeader } from '@/components/ui'
import { HelpTerm } from '@/components/HelpTerm'
import { useCollection } from '@/hooks/useCollection'
import { materialByKey } from '@/features/library/libraryData'
import { logActivity, repositories } from '@/repositories'
import { dataBus } from '@/services/dataBus'
import type { SavedPrompt } from '@/types/domain'
import {
  completeness,
  composePrompt,
  EMPTY_PROMPT,
  extractVariables,
  fillVariables,
  PROMPT_CATEGORIES,
  reviewPrompt,
} from './promptBuilder'
import type { PromptDraft } from './promptBuilder'
import './studio.css'

function fromSaved(record: SavedPrompt): PromptDraft {
  return {
    title: record.title,
    category: record.category,
    role: record.role,
    context: record.context,
    goal: record.goal,
    inputs: [...record.inputs],
    method: [...record.method],
    constraints: [...record.constraints],
    quality: [...record.quality],
    outputFormat: record.outputFormat,
    review: record.review,
  }
}

export default function StudioPage() {
  const [params] = useSearchParams()
  const { items: saved } = useCollection<SavedPrompt>('prompts')

  const material = materialByKey(params.get('material') ?? '')
  const [draft, setDraft] = useState<PromptDraft>(() =>
    material?.draft
      ? { ...material.draft, title: material.title, category: material.category }
      : { ...EMPTY_PROMPT },
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<string | null>(null)
  const [libraryKey, setLibraryKey] = useState<string | undefined>(material?.key)

  const composed = useMemo(() => composePrompt(draft), [draft])
  const variables = useMemo(() => extractVariables(composed), [composed])
  const finalText = useMemo(() => fillVariables(composed, values), [composed, values])
  const findings = useMemo(() => reviewPrompt(draft), [draft])
  const percent = useMemo(() => completeness(draft), [draft])

  // Variável removida do texto não deve continuar guardando valor.
  useEffect(() => {
    setValues((current) => {
      const next: Record<string, string> = {}
      for (const name of variables) if (current[name]) next[name] = current[name]
      return next
    })
  }, [variables])

  function set<K extends keyof PromptDraft>(field: K, value: PromptDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  async function save() {
    if (draft.title.trim().length < 2) {
      setFeedback('Dê um nome ao prompt antes de salvar.')
      return
    }
    const payload = {
      ...draft,
      title: draft.title.trim(),
      favorite: false,
      libraryKey,
    }
    if (editingId) {
      await repositories.prompts.update(editingId, payload)
      setFeedback('Prompt atualizado.')
    } else {
      const created = await repositories.prompts.create(payload)
      setEditingId(created.id)
      await logActivity({ kind: 'prompt-salvo', message: `Prompt salvo: ${created.title}.`, refId: created.id })
      setFeedback('Prompt salvo na sua coleção.')
    }
    dataBus.emit()
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(finalText)
      setFeedback('Prompt copiado. Cole na ferramenta de IA que você usa.')
    } catch {
      setFeedback('O navegador bloqueou a cópia — selecione o texto e copie manualmente.')
    }
  }

  function exportFile() {
    const blob = new Blob([finalText], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${(draft.title || 'prompt').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function load(record: SavedPrompt) {
    setDraft(fromSaved(record))
    setEditingId(record.id)
    setLibraryKey(record.libraryKey)
    setFeedback(`Editando "${record.title}".`)
  }

  async function toggleFavorite(record: SavedPrompt) {
    await repositories.prompts.update(record.id, { favorite: !record.favorite })
    dataBus.emit()
  }

  const sorted = [...saved].sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="studio">
      <header className="page-intro">
        <h1>Construtor de prompts</h1>
        <p className="lede">
          Um prompt estruturado rende respostas melhores do que um pedido solto. Monte aqui, revise a estrutura, preencha
          as variáveis e leve o texto para a ferramenta de IA que você usa.
        </p>
      </header>

      <Notice>
        <strong>Como isto funciona.</strong> O Studio monta e revisa o texto do prompt com regras locais — ele não está
        conectado a nenhum modelo de linguagem e não gera respostas. A integração com um provedor é prevista na
        arquitetura, com a credencial sempre no servidor. <Badge tone="neutral">Sem IA conectada</Badge>
      </Notice>

      {feedback && <Notice>{feedback}</Notice>}

      <div className="studio__layout">
        <div className="stack">
          <Panel>
            <div className="panel-body stack">
              <SectionHeader title="Estrutura" description="Cada bloco responde uma pergunta que o modelo faria." />
              <p className="secondary">
                Novo nisto? Entenda o que é um <HelpTerm termKey="prompt" label="prompt" /> e como funciona a{' '}
                <HelpTerm termKey="engenharia-de-prompt" label="engenharia de prompts" />.
              </p>
              <FormGrid>
                <TextField label="Nome do prompt" required value={draft.title} onChange={(value) => set('title', value)} />
                <SelectField
                  label="Categoria"
                  value={draft.category}
                  onChange={(value) => set('category', value)}
                  options={PROMPT_CATEGORIES.map((item) => ({ value: item, label: item }))}
                />
              </FormGrid>

              <TextAreaField
                label="Papel"
                rows={2}
                value={draft.role}
                onChange={(value) => set('role', value)}
                placeholder="Ex.: Você é redator de negócios locais, com estilo claro e sem exagero."
              />
              <TextAreaField
                label="Contexto"
                rows={3}
                value={draft.context}
                onChange={(value) => set('context', value)}
                hint="Use {{chaves}} para o que muda a cada uso: {{negocio}}, {{segmento}}."
              />
              <TextAreaField
                label="Objetivo"
                rows={2}
                value={draft.goal}
                onChange={(value) => set('goal', value)}
                placeholder="O que precisa sair daqui, em uma frase."
              />
              <ListField label="Entradas" items={draft.inputs} onChange={(items) => set('inputs', items)} placeholder="Ex.: lista de pratos e ingredientes" />
              <ListField label="Método" items={draft.method} onChange={(items) => set('method', items)} placeholder="Ex.: comece pelo ingrediente principal" />
              <ListField
                label="Restrições"
                items={draft.constraints}
                onChange={(items) => set('constraints', items)}
                placeholder="Ex.: máximo de 20 palavras por item"
                hint="É aqui que se evita a resposta inflada."
              />
              <ListField
                label="Critérios de qualidade"
                items={draft.quality}
                onChange={(items) => set('quality', items)}
                placeholder="Ex.: nenhuma informação fora das entradas"
              />
              <TextAreaField
                label="Formato da entrega"
                rows={2}
                value={draft.outputFormat}
                onChange={(value) => set('outputFormat', value)}
                placeholder="Ex.: tabela com três colunas"
              />
              <TextAreaField
                label="Revisão final"
                rows={2}
                value={draft.review}
                onChange={(value) => set('review', value)}
                placeholder="Ex.: antes de entregar, confira item por item se..."
              />
            </div>
          </Panel>
        </div>

        <div className="stack">
          <Panel tone="accent">
            <div className="panel-body stack">
              <SectionHeader title="Revisor estrutural" />
              <Meter label="Estrutura preenchida" value={percent} max={100} leftLabel="Blocos preenchidos" rightLabel={`${percent}%`} />
              <ul className="detail-list detail-list--plain">
                {findings.map((finding) => (
                  <li key={finding.message}>
                    <Icon name={finding.level === 'ok' ? 'check' : finding.level === 'falta' ? 'alert' : 'info'} size={14} />
                    <span>{finding.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          {variables.length > 0 && (
            <Panel>
              <div className="panel-body stack">
                <SectionHeader title="Variáveis" description="Preencha para gerar a versão final deste uso." />
                {variables.map((name) => (
                  <TextField
                    key={name}
                    label={name}
                    value={values[name] ?? ''}
                    onChange={(value) => setValues((current) => ({ ...current, [name]: value }))}
                  />
                ))}
              </div>
            </Panel>
          )}

          <Panel>
            <div className="panel-body stack">
              <SectionHeader title="Prompt final" />
              <pre className="offer-preview">{finalText || 'Preencha os blocos ao lado para montar o prompt.'}</pre>
              <div className="row prospecting__actions">
                <Button icon="check" onClick={() => void save()}>
                  {editingId ? 'Salvar alterações' : 'Salvar na coleção'}
                </Button>
                <Button variant="secondary" icon="message" onClick={() => void copy()}>
                  Copiar
                </Button>
                <Button variant="secondary" icon="download" onClick={exportFile}>
                  Exportar
                </Button>
                {editingId && (
                  <Button
                    variant="ghost"
                    icon="plus"
                    onClick={() => {
                      setDraft({ ...EMPTY_PROMPT })
                      setEditingId(null)
                      setLibraryKey(undefined)
                      setValues({})
                    }}
                  >
                    Novo
                  </Button>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel>
        <div className="panel-body stack">
          <SectionHeader title="Sua coleção" description="Prompts salvos neste dispositivo." />
          {sorted.length === 0 ? (
            <EmptyState
              icon="spark"
              title="Nenhum prompt salvo"
              text="Monte um aqui ou abra um material da Biblioteca — eles chegam já estruturados."
            />
          ) : (
            <ul className="record-list">
              {sorted.map((record) => (
                <li key={record.id} className="record-card">
                  <div className="record-card__main">
                    <div className="chip-row">
                      <Badge tone="neutral">{record.category}</Badge>
                      {record.favorite && <Badge tone="accent">Favorito</Badge>}
                    </div>
                    <h3 className="record-card__title">{record.title}</h3>
                    <p className="record-card__meta">{record.goal || 'Sem objetivo definido'}</p>
                  </div>
                  <div className="record-card__actions">
                    <Button size="sm" variant="ghost" icon="blueprint" onClick={() => load(record)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="spark"
                      aria-label={record.favorite ? `Remover ${record.title} dos favoritos` : `Favoritar ${record.title}`}
                      onClick={() => void toggleFavorite(record)}
                    >
                      {record.favorite ? 'Desfavoritar' : 'Favoritar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="trash"
                      aria-label={`Excluir ${record.title}`}
                      onClick={() => {
                        void (async () => {
                          await repositories.prompts.remove(record.id)
                          if (editingId === record.id) setEditingId(null)
                          dataBus.emit()
                        })()
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  )
}
