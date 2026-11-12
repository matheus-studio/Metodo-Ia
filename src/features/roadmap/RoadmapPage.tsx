import { Link } from 'react-router-dom'
import { MILESTONE_LABELS, MODULES } from '@/app/modules'
import type { ModuleStatus } from '@/app/modules'
import { Badge, Icon, Notice, Panel, SectionHeader } from '@/components/ui'
import './roadmap.css'

const ORDER: ModuleStatus[] = ['disponivel', 'marco-3']

const GROUP_TITLES: Record<ModuleStatus, string> = {
  disponivel: 'Disponível agora — Marcos 1, 2, 4 e 5',
  'marco-3': MILESTONE_LABELS['marco-3'],
}

export default function RoadmapPage() {
  return (
    <div className="roadmap">
      <header className="roadmap__intro">
        <h1>O que já funciona e o que vem a seguir</h1>
        <p className="lede">
          A navegação mostra apenas módulos entregues — nenhum botão leva a uma tela vazia. Esta página é o mapa
          completo, para você saber onde cada ferramenta entra.
        </p>
      </header>

      {ORDER.map((status) => {
        const modules = MODULES.filter((module) => module.status === status)
        if (modules.length === 0) return null
        return (
          <Panel key={status} tone={status === 'disponivel' ? 'accent' : 'default'}>
            <div className="panel-body">
              <SectionHeader
                title={GROUP_TITLES[status]}
                action={
                  <Badge tone={status === 'disponivel' ? 'success' : 'neutral'} dot>
                    {status === 'disponivel' ? 'Entregue' : 'Planejado'}
                  </Badge>
                }
              />
              <ul className="roadmap__list">
                {modules.map((module) => (
                  <li key={module.key} className="roadmap__item">
                    <span className="roadmap__icon">
                      <Icon name={module.icon} size={18} />
                    </span>
                    <div className="roadmap__text">
                      <p className="roadmap__name">
                        {status === 'disponivel' ? (
                          <Link to={module.path} className="roadmap__link">
                            {module.label}
                            <Icon name="chevron-right" size={14} />
                          </Link>
                        ) : (
                          module.label
                        )}
                      </p>
                      <p className="roadmap__summary">{module.summary}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        )
      })}

      <Notice tone="warning">
        <strong>Sobre o Radar de empresas reais (Marco 3).</strong> A busca só passa a existir com uma fonte de dados
        cuja licença permita o uso comercial pretendido, com as consultas atrás de um backend — chave de API nunca no
        navegador — e com limite de custo por consulta. Até lá, nenhuma empresa é exibida como se tivesse vindo de uma
        API, e a ausência de site em uma base nunca será tratada como prova de que a empresa não tem site.
      </Notice>
    </div>
  )
}
