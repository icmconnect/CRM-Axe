import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Clock, Sparkles, AlertTriangle, CheckCircle2, CreditCard, ShieldCheck, X } from 'lucide-react';
import Modal from './Modal';
import PlanosCards from './PlanosCards';

export default function TrialBanner() {
  const { casa, userRole, refreshCasa } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    return localStorage.getItem('hide_active_plan_banner') === 'true';
  });

  const toggleDismissBanner = (val: boolean) => {
    setIsBannerDismissed(val);
    if (val) {
      localStorage.setItem('hide_active_plan_banner', 'true');
    } else {
      localStorage.removeItem('hide_active_plan_banner');
    }
  };

  // Exibir apenas para administradores da casa
  if (!userRole || userRole.role !== 'ADMIN_CASA') {
    return null;
  }

  if (!casa) {
    return null;
  }

  // Função auxiliar para calcular dias do trial
  const getDaysRemaining = (trialAteStr?: string) => {
    if (!trialAteStr) return 0;
    const trialAte = new Date(trialAteStr);
    const today = new Date();
    const diffTime = trialAte.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining(casa.trial_ate);
  const daysUsed = Math.max(0, Math.min(7, 7 - daysRemaining));
  const progressPercentage = (daysUsed / 7) * 100;

  const handleSelectPlano = async (planoId: string) => {
    try {
      setLoading(true);
      const casaRef = doc(db, 'casas_axe', casa.id);
      await updateDoc(casaRef, {
        status: 'ativo',
        plano: planoId
      });
      await refreshCasa();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao assinar plano:', err);
      alert('Erro ao ativar plano de assinatura. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Se casa suspensa
  if (casa.status === 'suspenso') {
    return (
      <div className="w-full bg-red-100 border-b border-red-200 text-red-800 px-4 py-3 sm:px-6 flex justify-between items-center text-xs sm:text-sm font-bold shadow-inner">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-600 animate-pulse" />
          <span>🚫 Seu acesso foi suspenso. Por favor, regularize seu plano de assinatura.</span>
        </div>
        <a 
          href="https://wa.me/5514981570008?text=Ol%C3%A1%21%20Meu%20acesso%20no%20Portal%20dos%20Sacerdotes%20est%C3%A1%20suspenso%20e%20gostaria%20de%20regularizar." 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline hover:text-red-950 font-black"
        >
          Regularizar agora
        </a>
      </div>
    );
  }

  // Se casa ativa
  if (casa.status === 'ativo') {
    const planoNome = (casa.plano || 'essencial').toUpperCase();

    if (isBannerDismissed && !isModalOpen) {
      return null;
    }

    return (
      <>
        {!isBannerDismissed && (
          <div className="w-full bg-[#ECFDF5] border-b border-[#A7F3D0] text-[#065F46] px-4 py-2.5 sm:px-6 flex items-center justify-between text-[11px] sm:text-xs font-semibold shadow-sm transition-all animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span>✅ Assinatura Ativa: Plano <strong className="font-extrabold text-emerald-800">{planoNome}</strong> contratado com sucesso.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-[10px] bg-white border border-[#A7F3D0] hover:bg-[#D1FAE5] text-[#047857] px-3 py-1.5 rounded-full font-bold shadow-sm transition-all"
              >
                Ver Detalhes do Plano
              </button>
              <button
                onClick={() => toggleDismissBanner(true)}
                className="text-[10px] text-[#047857] hover:bg-[#D1FAE5] p-1.5 rounded-full transition-colors font-bold flex items-center gap-1"
                title="Ocultar aviso de assinatura"
              >
                <X size={14} />
                <span>Ocultar</span>
              </button>
            </div>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Nossos Planos de Gestão"
          maxWidth="2xl"
        >
          <div className="text-center mb-4 max-w-lg mx-auto">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Alterar Plano de Assinatura</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sua casa está ativa no plano <strong className="text-emerald-700 dark:text-emerald-400">{planoNome}</strong>. Se desejar, escolha um plano abaixo para alterar seu pacote.</p>
          </div>
          <PlanosCards onSelectPlano={handleSelectPlano} />
        </Modal>
      </>
    );
  }

  // Se casa em trial
  const isLastDay = daysRemaining <= 1;

  return (
    <div className="w-full">
      {/* Banner de Trial */}
      <div 
        className={`w-full border-b border-[#FDE68A]/60 px-4 py-3 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm transition-all ${
          isLastDay 
            ? 'bg-amber-100 animate-pulse text-[#78350F] font-black border-red-200' 
            : 'bg-[#FFF9E6] text-[#78350F] font-bold'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 flex-1">
          <div className="flex items-center gap-2">
            {isLastDay ? (
              <AlertTriangle size={18} className="text-red-500 animate-bounce shrink-0" />
            ) : (
              <Clock size={18} className="text-amber-600 shrink-0" />
            )}
            <span>
              {isLastDay ? (
                <span>⚠️ Último dia de trial! Escolha um plano para não perder o acesso.</span>
              ) : (
                <span>⏳ Trial Gratuito: <strong>{daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}</strong> de teste.</span>
              )}
            </span>
          </div>

          {/* Barra de Progresso */}
          <div className="flex items-center gap-2 flex-grow max-w-[200px] sm:max-w-[300px]">
            <div className="w-full bg-amber-200/50 rounded-full h-2 overflow-hidden border border-[#FDE68A]/30">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isLastDay ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-[10px] text-amber-800 shrink-0 font-medium whitespace-nowrap">
              {daysUsed}/7 dias
            </span>
          </div>
        </div>

        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            className={`px-4 py-1.5 rounded-full font-black text-[11px] shadow-sm tracking-wide uppercase transition-all duration-200 active:scale-[0.98] ${
              isLastDay 
                ? 'bg-red-600 hover:bg-red-700 text-white hover:shadow-red-200/40' 
                : 'bg-[#D97706] hover:bg-[#B45309] text-white hover:shadow-amber-100/40'
            }`}
          >
            Escolher Plano
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Escolha Seu Plano de Gestão"
        maxWidth="2xl"
      >
        <div className="text-center mb-4 max-w-lg mx-auto">
          <div className="inline-flex p-2 bg-amber-50 rounded-full text-amber-600 mb-2 border border-amber-100">
            <Sparkles size={20} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Selecione o plano ideal para sua casa</h3>
          <p className="text-xs text-slate-500 mt-1">Após os 7 dias gratuitos, selecione o plano de assinatura ideal. Você pode reajustar ou cancelar a qualquer momento.</p>
        </div>
        <PlanosCards onSelectPlano={handleSelectPlano} />
      </Modal>
    </div>
  );
}
