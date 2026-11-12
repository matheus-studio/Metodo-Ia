import { LinkButton, Panel } from '@/components/ui'

export function NotFoundPage() {
  return (
    <Panel tone="accent">
      <div className="panel-body stack">
        <p className="eyebrow">Erro 404</p>
        <h1>Esta página ainda não existe</h1>
        <p className="lede">
          O endereço pode estar errado, ou o módulo correspondente ainda está em um marco futuro do desenvolvimento.
        </p>
        <div className="row">
          <LinkButton to="/" icon="dashboard">
            Voltar ao painel
          </LinkButton>
          <LinkButton to="/roteiro" variant="secondary" iconEnd="chevron-right">
            Ver o roteiro
          </LinkButton>
        </div>
      </div>
    </Panel>
  )
}
