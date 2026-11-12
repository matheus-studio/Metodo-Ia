import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Limite de erro de aplicação: uma falha de renderização não pode derrubar a
 * tela inteira sem explicação, e a mensagem mostrada nunca expõe o stack.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Em produção isto vira envio para um coletor próprio, nunca com dados do usuário.
    if (import.meta.env.DEV) {
      console.error('Falha de renderização:', error, info.componentStack)
    }
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="panel" style={{ margin: '2rem auto', maxWidth: '38rem' }}>
          <div className="panel-body stack">
            <h1>Algo saiu do lugar</h1>
            <p className="secondary">
              A tela encontrou um erro inesperado. Seus dados locais continuam salvos — recarregar costuma resolver.
            </p>
            <div>
              <button type="button" className="btn btn--primary btn--md" onClick={() => window.location.reload()}>
                <span className="btn__label">Recarregar o aplicativo</span>
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
