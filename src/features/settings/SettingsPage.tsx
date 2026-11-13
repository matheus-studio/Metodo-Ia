import { useRef, useState } from 'react'
import { usePreferences } from '@/app/preferencesContext'
import { Badge, Button, Icon, Notice, Panel, SectionHeader } from '@/components/ui'
import { logActivity } from '@/repositories'
import { APP_VERSION } from '@/app/version'
import { clearAllData, exportBackup, importBackup, parseBackup } from '@/storage/backup'
import { saveTextFile } from '@/storage/saveFile'
import { InstallCard } from '@/pwa/InstallCard'
import { STORAGE_MESSAGES, useStorageHealth } from '@/hooks/useStorageHealth'
import { dataBus } from '@/services/dataBus'
import { loadDemoData, removeDemoData } from '@/services/demoData'
import './settings.css'

type Feedback = { tone: 'info' | 'warning' | 'danger'; message: string } | null

const MAX_IMPORT_BYTES = 12_000_000

export default function SettingsPage() {
  const { preferences, update } = usePreferences()
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [busy, setBusy] = useState(false)
  const [skillDraft, setSkillDraft] = useState('')
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const storage = useStorageHealth()
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setBusy(true)
    try {
      const backup = await exportBackup()
      const result = await saveTextFile(
        `metodo-ia-pro-backup-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(backup, null, 2),
      )
      await logActivity({ kind: 'dados-exportados', message: 'Backup exportado para arquivo JSON.' })
      setFeedback({ tone: 'info', message:
          result === 'compartilhado'
            ? 'Backup gerado. Escolha onde guardar o arquivo na janela que abriu.'
            : 'Backup gerado. O arquivo foi enviado para a pasta de downloads.' })
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message: error instanceof Error ? error.message : 'Não foi possível gerar o backup.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(file: File, mode: 'merge' | 'replace') {
    if (file.size > MAX_IMPORT_BYTES) {
      setFeedback({ tone: 'danger', message: 'Arquivo acima do limite aceito para importação.' })
      return
    }
    setBusy(true)
    try {
      const parsed = parseBackup(await file.text())
      const summary = await importBackup(parsed, mode)
      await logActivity({
        kind: 'dados-importados',
        message: `Backup restaurado (${summary.imported} registros, modo ${mode === 'merge' ? 'mesclar' : 'substituir'}).`,
      })
      dataBus.emit()
      setFeedback({
        tone: storage.mode === 'persistente' ? 'info' : 'warning',
        message:
          `${summary.imported} registro(s) restaurado(s) em modo ${summary.mode === 'merge' ? 'mesclar' : 'substituir'}.` +
          (summary.atomic
            ? ' A gravação foi atômica: ou tudo entrou, ou nada mudaria.'
            : ' Sem IndexedDB neste navegador: os dados restaurados ficam apenas nesta aba.'),
      })
    } catch (error) {
      setFeedback({
        tone: 'danger',
        message: error instanceof Error ? error.message : 'Arquivo de backup inválido.',
      })
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function handleDemo(action: 'load' | 'remove') {
    setBusy(true)
    try {
      if (action === 'load') {
        await loadDemoData()
        setFeedback({ tone: 'warning', message: 'Dados de demonstração carregados e sinalizados no painel.' })
      } else {
        const removed = await removeDemoData()
        setFeedback({ tone: 'info', message: `${removed} registro(s) de demonstração removido(s).` })
      }
      dataBus.emit()
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    setBusy(true)
    try {
      await clearAllData()
      dataBus.emit()
      setConfirmingReset(false)
      setFeedback({ tone: 'warning', message: 'Todos os registros locais foram apagados.' })
    } finally {
      setBusy(false)
    }
  }

  function addSkill() {
    const value = skillDraft.trim().slice(0, 40)
    if (!value || preferences.skills.includes(value)) return
    update({ skills: [...preferences.skills, value].slice(0, 40), onboardingDone: true })
    setSkillDraft('')
  }

  return (
    <div className="settings">
      <header className="settings__intro">
        <h1>Seu perfil, aparência e dados</h1>
        <p className="lede">
          Tudo nesta tela fica neste dispositivo. Não há conta, sincronização ou envio para servidores nesta etapa do
          produto.
        </p>
      </header>

      {feedback && (
        <Notice tone={feedback.tone}>
          <span>{feedback.message}</span>
        </Notice>
      )}

      <Panel tone={storage.mode === 'persistente' ? 'flat' : 'accent'}>
        <div className="panel-body stack">
          <SectionHeader
            title="Onde seus dados estão"
            action={
              <Badge tone={storage.mode === 'persistente' ? 'success' : storage.mode === 'verificando' ? 'neutral' : 'danger'} dot>
                {storage.mode === 'persistente'
                  ? 'Gravando no aparelho'
                  : storage.mode === 'verificando'
                    ? 'Verificando…'
                    : storage.mode === 'sem-espaco'
                      ? 'Sem espaço'
                      : 'Apenas nesta aba'}
              </Badge>
            }
          />
          {STORAGE_MESSAGES[storage.mode] ? (
            <Notice tone="danger">
              <strong>Atenção.</strong> {STORAGE_MESSAGES[storage.mode]}
              {storage.detail ? ` (${storage.detail})` : ''}
            </Notice>
          ) : (
            <p className="secondary">
              O armazenamento local está respondendo normalmente. Seus registros continuam neste navegador depois de
              fechar a janela — mas não são sincronizados com outros aparelhos: para isso, exporte o backup.
            </p>
          )}
        </div>
      </Panel>

      <InstallCard />

      {/* --------------------------------------------------------- Perfil */}
      <Panel index={0}>
        <div className="panel-body stack">
          <SectionHeader
            title="Perfil de trabalho"
            description="Usado pelo painel para recomendar o próximo passo e, mais à frente, pela calculadora de preços."
          />

          <div className="field-grid">
            <label className="field">
              <span className="field__label">Como quer ser chamado</span>
              <input
                className="field__input"
                type="text"
                maxLength={80}
                value={preferences.displayName ?? ''}
                onChange={(event) => update({ displayName: event.target.value })}
                placeholder="Seu nome ou apelido"
              />
            </label>

            <label className="field">
              <span className="field__label">Valor por hora (R$)</span>
              <input
                className="field__input tabular"
                type="number"
                min={0}
                step={5}
                inputMode="decimal"
                value={preferences.hourlyRate ?? ''}
                onChange={(event) =>
                  update({ hourlyRate: event.target.value === '' ? undefined : Number(event.target.value) })
                }
                placeholder="Ex.: 80"
              />
              <span className="field__hint">Ponto de partida para orçamentos. Você pode mudar em cada proposta.</span>
            </label>

            <label className="field">
              <span className="field__label">Meta de contatos por semana</span>
              <input
                className="field__input tabular"
                type="number"
                min={0}
                max={500}
                value={preferences.weeklyGoalContacts ?? 0}
                onChange={(event) => update({ weeklyGoalContacts: Number(event.target.value) })}
              />
              <span className="field__hint">Alimenta o medidor "Ritmo da semana" no painel.</span>
            </label>
          </div>

          <div className="stack">
            <span className="field__label">Suas habilidades</span>
            <div className="row">
              <input
                className="field__input"
                type="text"
                maxLength={40}
                value={skillDraft}
                onChange={(event) => setSkillDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addSkill()
                  }
                }}
                placeholder="Ex.: criação de sites, edição de vídeo"
                aria-label="Adicionar habilidade"
              />
              <Button onClick={addSkill} icon="plus" variant="secondary">
                Adicionar
              </Button>
            </div>
            {preferences.skills.length > 0 && (
              <div className="chip-row">
                {preferences.skills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className="chip"
                    onClick={() => update({ skills: preferences.skills.filter((item) => item !== skill) })}
                    aria-label={`Remover habilidade ${skill}`}
                  >
                    {skill}
                    <Icon name="close" size={13} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* ------------------------------------------------------ Aparência */}
      <Panel index={1}>
        <div className="panel-body stack">
          <SectionHeader title="Aparência" description="O tema escuro é o padrão da identidade; o claro tem o mesmo contraste mínimo." />
          <div className="chip-row">
            {(['dark', 'light', 'system'] as const).map((theme) => (
              <button
                key={theme}
                type="button"
                className={preferences.theme === theme ? 'chip is-selected' : 'chip'}
                onClick={() => update({ theme })}
                aria-pressed={preferences.theme === theme}
              >
                <Icon name={theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'settings'} size={14} />
                {theme === 'dark' ? 'Escuro' : theme === 'light' ? 'Claro' : 'Seguir o sistema'}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* ----------------------------------------------------------- Dados */}
      <Panel index={2}>
        <div className="panel-body stack">
          <SectionHeader
            title="Backup e restauração"
            description="Os dados ficam só neste navegador. Exporte com regularidade — limpar os dados do site apaga tudo."
          />

          <div className="row settings__actions">
            <Button onClick={() => void handleExport()} disabled={busy} icon="download">
              Exportar backup
            </Button>
            <Button
              variant="secondary"
              icon="upload"
              disabled={busy}
              onClick={() => {
                setImportMode('merge')
                fileInput.current?.click()
              }}
            >
              Restaurar (mesclar)
            </Button>
            <Button
              variant="ghost"
              icon="upload"
              disabled={busy}
              onClick={() => {
                setImportMode('replace')
                fileInput.current?.click()
              }}
            >
              Restaurar (substituir)
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleImport(file, importMode)
              }}
            />
          </div>

          <Notice>
            <strong>Mesclar</strong> grava os registros do arquivo por id e preserva o que já existe aqui.{' '}
            <strong>Substituir</strong> apaga as coleções presentes no arquivo antes de gravar. Nos dois casos o
            arquivo inteiro é validado antes de qualquer gravação, e a escrita é feita em uma única transação: se algo
            falhar no meio, nada muda — você não fica com metade dos dados.
          </Notice>
        </div>
      </Panel>

      {/* ---------------------------------------------------- Demonstração */}
      <Panel index={3}>
        <div className="panel-body stack">
          <SectionHeader
            title="Dados de demonstração"
            description="Para conhecer a interface antes de ter registros próprios."
            action={<Badge tone="neutral">Opcional</Badge>}
          />
          <Notice tone="warning">
            Os registros de demonstração são <strong>fictícios e sinalizados</strong>. Não vêm de nenhuma API, não
            representam empresas reais e podem ser removidos sem afetar o que você criou.
          </Notice>
          <div className="row settings__actions">
            <Button variant="secondary" icon="spark" disabled={busy} onClick={() => void handleDemo('load')}>
              Carregar demonstração
            </Button>
            <Button variant="ghost" icon="trash" disabled={busy} onClick={() => void handleDemo('remove')}>
              Remover demonstração
            </Button>
          </div>
        </div>
      </Panel>

      {/* ------------------------------------------------------ Zona final */}
      <Panel index={4}>
        <div className="panel-body stack">
          <SectionHeader title="Apagar todos os dados" description="Ação irreversível neste dispositivo." />
          {confirmingReset ? (
            <div className="stack">
              <Notice tone="danger">
                Isso remove <strong>todos</strong> os registros locais: empresas, serviços, ofertas, contatos,
                negociações, projetos, tarefas e histórico. Exporte um backup antes se quiser poder voltar atrás.
              </Notice>
              <div className="row settings__actions">
                <Button variant="danger" icon="trash" disabled={busy} onClick={() => void handleReset()}>
                  Sim, apagar tudo
                </Button>
                <Button variant="ghost" onClick={() => setConfirmingReset(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="row settings__actions">
              <Button variant="danger" icon="trash" onClick={() => setConfirmingReset(true)}>
                Apagar todos os dados
              </Button>
            </div>
          )}
        </div>
      </Panel>

      <Panel index={5} tone="flat">
        <div className="panel-body stack">
          <SectionHeader title="Privacidade" description="O que o aplicativo faz com informação, hoje." />
          <ul className="bullets">
            <li>Nenhum dado sai deste dispositivo: não há conta, servidor de aplicação nem telemetria nesta versão.</li>
            <li>As fontes de tipografia são servidas pelo próprio aplicativo, sem requisição a terceiros.</li>
            <li>
              Quando o Radar de empresas reais entrar (Marco 3), os dados de provedores externos obedecerão à licença da
              fonte e ficarão separados do que você cadastrar manualmente.
            </li>
            <li>Dados locais não são sincronizados entre dispositivos. O backup é a forma de levá-los para outro.</li>
          </ul>
          <p className="muted">Método IA Pro, versão {APP_VERSION}. Informe esta versão ao pedir suporte.</p>
        </div>
      </Panel>
    </div>
  )
}
