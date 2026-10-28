import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

/** Se uma tela quebrar, mostra uma mensagem e mantém o resto do app (e o progresso) funcionando. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error(error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page narrow">
        <div className="card empty">
          <AlertTriangle size={36} />
          <h3>Algo deu errado nesta tela</h3>
          <p className="small">Seu progresso está salvo. Volte ao início e tente de novo.</p>
          <p className="xs faint">{this.state.error.message}</p>
          <a className="btn primary" href="#/" onClick={() => this.setState({ error: null })}>
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }
}
