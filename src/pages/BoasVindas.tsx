import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CheckCircle2, Users, Landmark, Calendar, Share2, Compass, AlertCircle, ArrowRight } from 'lucide-react';

interface CasaAxe {
  nome: string;
  admin_nome: string;
  trial_ate: string;
}

export default function BoasVindas() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idCasa = searchParams.get('id_casa');

  const [casa, setCasa] = useState<CasaAxe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDadosCasa() {
      if (!idCasa) {
        setLoading(false);
        return;
      }
      try {
        const casaSnap = await getDoc(doc(db, 'casas_axe', idCasa));
        if (casaSnap.exists()) {
          setCasa(casaSnap.data() as CasaAxe);
        }
      } catch (err) {
        console.error('Erro ao buscar casa em BoasVindas:', err);
      } finally {
        setLoading(false);
      }
    }
    carregarDadosCasa();
  }, [idCasa]);

  const handleIrParaSistema = () => {
    navigate('/');
  };

  const formatarData = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const data = new Date(isoString);
      return data.toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-xl border border-[#FEF3C7]/40 p-6 sm:p-12 overflow-hidden relative">
        {/* Banner Decorativo no Topo */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309]"></div>

        <div className="text-center mb-10 mt-4 relative z-10">
          <div className="inline-flex items-center justify-center p-4 bg-[#FEF3C7]/60 text-[#D97706] rounded-full mb-4 ring-8 ring-[#FEF3C7]/30">
            <Compass size={40} className="animate-spin-slow text-[#D97706]" />
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-serif font-black text-slate-900 tracking-tight">
            Axé, {casa?.admin_nome || 'Sacerdote'}!
          </h1>
          <p className="text-slate-500 text-sm sm:text-lg mt-3 max-w-xl mx-auto leading-relaxed">
            Seu terreiro já possui uma infraestrutura digital segura no <strong className="text-slate-800">Ase Connect</strong>.
          </p>

          {casa && (
            <div className="mt-5 inline-block bg-slate-50 border border-slate-100 rounded-2xl px-6 py-2.5 shadow-sm">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Sua Casa Cadastrada:</span>
              <span className="text-sm font-black text-[#D97706] uppercase">{casa.nome}</span>
            </div>
          )}
        </div>

        {/* 4 Passos Iniciais */}
        <div className="mb-10 relative z-10">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-6">
            Guia Rápido de Configuração Inicial (4 Passos Livres)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Passo 1 */}
            <div className="border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="bg-[#FEF3C7] text-[#D97706] p-3 rounded-xl w-fit mb-4">
                  <Users size={18} />
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  1. Membros
                </h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
                  Cadastre os primeiros filhos de santo e preencha as datas de santo correspondentes.
                </p>
              </div>
              <span className="text-[10px] text-[#D97706] font-bold mt-4 block group-hover:underline">Começar no menu ›</span>
            </div>

            {/* Passo 2 */}
            <div className="border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="bg-[#FEF3C7] text-[#D97706] p-3 rounded-xl w-fit mb-4">
                  <Landmark size={18} />
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  2. Fluxo de Caixa
                </h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
                  Faça o primeiro lançamento de entrada ou as mensalidades (doações / dotes / despesas).
                </p>
              </div>
              <span className="text-[10px] text-[#D97706] font-bold mt-4 block group-hover:underline">Começar no menu ›</span>
            </div>

            {/* Passo 3 */}
            <div className="border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="bg-[#FEF3C7] text-[#D97706] p-3 rounded-xl w-fit mb-4">
                  <Calendar size={18} />
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  3. Obrigações
                </h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
                  Crie a primeira festa pública, ritual de feitura ou obrigação anual para mobilizar materiais.
                </p>
              </div>
              <span className="text-[10px] text-[#D97706] font-bold mt-4 block group-hover:underline">Começar no menu ›</span>
            </div>

            {/* Passo 4 */}
            <div className="border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="bg-[#FEF3C7] text-[#D97706] p-3 rounded-xl w-fit mb-4">
                  <Share2 size={18} />
                </div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  4. Convidar
                </h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-semibold">
                  Compartilhe o acesso restrito com seus diretores e filhos, respeitando as permissões da casa.
                </p>
              </div>
              <span className="text-[10px] text-[#D97706] font-bold mt-4 block group-hover:underline">Começar no menu ›</span>
            </div>
          </div>
        </div>

        {/* Mensagem sobre Trial */}
        <div className="bg-amber-50/50 border border-[#FEF3C7] rounded-2xl p-5 mb-10 flex gap-4 items-start relative z-10">
          <AlertCircle className="text-[#D97706] shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-xs font-black text-[#B45309] uppercase tracking-wider">Período de Experimentação Gratuito Ativado</h4>
            <p className="text-[11px] text-amber-955 text-amber-900 leading-relaxed mt-1 font-semibold">
              Seu período promocional vai até o dia <strong className="font-extrabold">{formatarData(casa?.trial_ate)}</strong>. Não se preocupe: nenhum valor será cobrado sem o seu consentimento manual ao final do prazo. Aproveite para desfrutar da leitura inteligente de comprovantes!
            </p>
          </div>
        </div>

        {/* Botão de Redirecionamento Principal */}
        <div className="flex flex-col items-center justify-center relative z-10 border-t border-slate-100 pt-8">
          <button
            onClick={handleIrParaSistema}
            className="bg-[#D97706] hover:bg-[#B45309] text-white font-serif font-bold py-4.5 px-10 rounded-2xl shadow-xl hover:shadow-[#D97706]/20 transition-all active:scale-[0.98] duration-200 text-sm flex items-center gap-3"
          >
            Acessar o Painel Principal
            <ArrowRight size={18} />
          </button>
          <p className="text-[10px] text-slate-400 font-medium mt-3">
            Sua conta está integrada de forma segura e criptografada via Firebase.
          </p>
        </div>
      </div>
    </div>
  );
}
