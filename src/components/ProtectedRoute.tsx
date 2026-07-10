/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/roles';

interface ProtectedRouteProps {
  children: ReactNode;
  nivelMinimo: Role;
  fallback?: ReactNode;
}

export default function ProtectedRoute({ children, nivelMinimo, fallback }: ProtectedRouteProps) {
  const { user, userRole, casa, loading, temPermissao } = useAuth();
  const navigate = useNavigate();

  // 1. Mostrar Spinner Centralizado de Carregamento
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FFFDF7] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#D97706]" />
        <span className="text-sm font-medium text-slate-600">Verificando credenciais e permissões...</span>
      </div>
    );
  }

  // Se o terreiro/casa de axé está suspenso
  if (casa?.status === 'suspenso') {
    return <Navigate to="/suspenso" replace />;
  }

  // 2. Se não estiver autenticado de forma alguma
  if (!user || !userRole) {
    return <div className="min-h-screen w-full flex items-center justify-center bg-[#FFFDF7]">Acesso negado. Por favor, faça login.</div>;
  }

  // 3. Se possui permissão, renderizar children normalmente
  if (temPermissao(nivelMinimo)) {
    return <>{children}</>;
  }

  // 4. Se houver um fallback customizado, renderizar
  if (fallback) {
    return <>{fallback}</>;
  }

  // 5. Exibir tela de acesso restrito estilizada de alta qualidade (Aesthetic Design)
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-4">
      <div id="restrito-card" className="bg-white border border-[#FDE68A] shadow-xl hover:shadow-2xl transition-all rounded-3xl p-8 max-w-md w-full text-center flex flex-col items-center gap-6">
        <div className="bg-[#FEF3C7] p-4 rounded-2xl text-[#D97706]">
          <ShieldOff size={48} strokeWidth={1.5} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Acesso Restrito</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Seu nível de acesso atual, <span className="font-semibold text-[#D97706]">{userRole.role}</span>, não possui as credenciais necessárias para visualizar este conteúdo. Esta área exige nível mínimo de <span className="font-semibold text-[#B45309]">{nivelMinimo}</span>.
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white py-3 px-6 rounded-xl font-bold tracking-wide shadow-md transition-all active:scale-[0.98]"
        >
          Voltar ao Início
        </button>
      </div>
    </div>
  );
}
