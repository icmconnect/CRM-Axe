import React, { Component, ErrorInfo, ReactNode } from 'react';
import { auth } from '../firebase';
import { addDoc } from '../lib/firestore';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Registrar o erro no Firestore
    this.saveErrorToFirestore(error, errorInfo);
  }

  private async saveErrorToFirestore(error: Error, errorInfo: ErrorInfo) {
    try {
      await addDoc('error_logs', {
        timestamp: new Date().toISOString(),
        mensagem: error.message || 'Erro sem mensagem',
        stack: error.stack || '',
        componentStack: errorInfo.componentStack || '',
        usuario_email: auth.currentUser?.email || 'Desconhecido',
        userAgent: navigator.userAgent,
      });
    } catch (e) {
      console.error('Falha ao reportar erro ao Firestore:', e);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 max-w-lg w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
              <AlertOctagon size={36} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-800">Ops! Algo deu errado</h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Ocorreu uma falha inesperada no sistema. O erro já foi registrado e nossa equipe técnica foi notificada.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-100 overflow-x-auto max-h-40">
                <p className="text-xs font-mono text-red-600 font-bold whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(this.state.error?.stack || this.state.error?.message || '');
                    alert('Código de erro copiado para a área de transferência.');
                  } catch (e) {
                    alert('Não foi possível copiar automaticamente.');
                  }
                }}
                className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all"
              >
                Copiar Erro
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white py-3 rounded-xl text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
