import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorDebug extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorDebug] caught error:`, error, errorInfo);
  }

  public render() {
    const self = this as any;
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-3xl m-4 text-slate-800 font-mono text-xs shadow-xl max-w-2xl mx-auto">
          <h3 className="text-sm font-bold text-red-700 mb-2">
            ⚠️ Erro de Renderização: {self.props.componentName || 'Componente'}
          </h3>
          <p className="font-semibold text-red-600 mb-4 whitespace-pre-wrap">
            {this.state.error?.toString()}
          </p>
          <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl overflow-x-auto max-h-60 leading-relaxed font-mono">
            <pre className="whitespace-pre">{this.state.error?.stack}</pre>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => self.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-red-200/40"
            >
              Tentar Renderizar Novamente
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
            >
              Recarregar Sistema
            </button>
          </div>
        </div>
      );
    }

    return self.props.children;
  }
}
