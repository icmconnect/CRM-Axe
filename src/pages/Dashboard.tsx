import React, { useState, useMemo, useEffect } from 'react';
import { addDoc } from '../lib/firestore';
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';
import { Role } from '../types/roles';
import Modal from '../components/Modal';
import PlanosCards from '../components/PlanosCards';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, TrendingUp, TrendingDown, PlusCircle, Wallet, Gift, FileText, Download, Share2, X, User, Clock, ChevronDown, ChevronLeft, ChevronRight, ShieldCheck, CheckCircle2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Dashboard() {
  const { membros, financeiro: allFinanceiro, loading } = useData();

  // Form states para lançamento rápido
  const [selectedMembro, setSelectedMembro] = useState('');
  const [valor, setValor] = useState('');
  const [doadorNome, setDoadorNome] = useState('');
  const [categoriaRapida, setCategoriaRapida] = useState('Mensalidade');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRelatorioModalOpen, setIsRelatorioModalOpen] = useState(false);

  // States para o SIST, Planos e Banner do Plano Ativo
  const [showActivePlanBanner, setShowActivePlanBanner] = useState(true);
  const [showCistModal, setShowCistModal] = useState(false);
  const [showPlanosModal, setShowPlanosModal] = useState(false);
  const [casaInfo, setCasaInfo] = useState({ nome: 'Casa Principal', plano: 'COMUNIDADE' });
  const [systemUsersCount, setSystemUsersCount] = useState(1);

  const handleSelectPlanoFromDashboard = async (novoPlano: string) => {
    const casaId = assumedCasaId || userRole?.id_casa || 'casa_principal';
    try {
      const docRef = doc(db, 'casas_axe', casaId);
      await updateDoc(docRef, { plano: novoPlano.toUpperCase() });
      setCasaInfo(prev => ({ ...prev, plano: novoPlano.toUpperCase() }));
      alert(`Plano alterado com sucesso para ${novoPlano.toUpperCase()}!`);
      setShowPlanosModal(false);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao atualizar plano: ' + err.message);
    }
  };

  // Modal Convidar Usuário do Sistema
  const [showInviteUserModal, setShowInviteUserModal] = useState(false);
  const [inviteNome, setInviteNome] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>(Role.EDITOR);
  const [savingInvite, setSavingInvite] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const { userRole, assumedCasaId } = useAuth();

  // Auto-dismiss do Banner de Assinatura Ativa após 8s
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowActivePlanBanner(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Carregar dados da casa e usuários cadastrados para o CIST
  useEffect(() => {
    async function loadCasaAndUsers() {
      const casaId = assumedCasaId || userRole?.id_casa || 'casa_principal';
      try {
        const docRef = doc(db, 'casas_axe', casaId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setCasaInfo({
            nome: data.nome || 'Casa Principal',
            plano: data.plano || 'COMUNIDADE'
          });
        }

        const q = query(collection(db, 'users'), where('id_casa', '==', casaId));
        const usersSnap = await getDocs(q);
        setSystemUsersCount(usersSnap.size || 1);
      } catch (err) {
        console.error('Erro ao buscar dados para o CIST:', err);
      }
    }
    loadCasaAndUsers();
  }, [assumedCasaId, userRole?.id_casa]);

  const getLimitePlanoUsers = (planoNome?: string) => {
    if (!planoNome) return { max: 7, nome: 'Comunidade' };
    const p = planoNome.toLowerCase().trim();
    if (p.includes('avançad') || p.includes('avancad') || p.includes('federa')) return { max: 8, nome: 'Federação / Avançado' };
    if (p.includes('basico') || p.includes('básico') || p.includes('essencial')) return { max: 5, nome: 'Básico / Essencial' };
    return { max: 7, nome: 'Comunidade / Intermediário' };
  };

  const handleConvidarUsuarioSistema = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg(null);

    if (!inviteEmail || !inviteEmail.includes('@')) {
      setInviteMsg({ tipo: 'erro', texto: 'Informe um e-mail válido.' });
      return;
    }

    const isGustavoMaster = auth.currentUser?.email === 'gustavomacedo.consultor@gmail.com';
    const planoInfo = getLimitePlanoUsers(casaInfo.plano);

    if (!isGustavoMaster && systemUsersCount >= planoInfo.max) {
      setInviteMsg({
        tipo: 'erro',
        texto: `Você atingiu o limite de ${planoInfo.max} usuários do seu plano ${planoInfo.nome}. Faça upgrade para convidar mais auxiliares.`
      });
      return;
    }

    setSavingInvite(true);
    try {
      const targetCasaId = assumedCasaId || userRole?.id_casa || 'casa_principal';
      const newDocRef = doc(collection(db, 'users'));
      await setDoc(newDocRef, {
        nome: inviteNome.trim() || 'Usuário Convidado',
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        id_casa: targetCasaId,
        bloqueado: false,
        ambiente: userRole?.ambiente || 'producao',
        created_at: new Date().toISOString(),
        convidado_por: auth.currentUser?.email || 'sistema'
      });

      await addDoc('audit_logs', {
        data: new Date().toISOString(),
        usuario_email: auth.currentUser?.email || 'sistema',
        acao: 'CONVIDAR_USUARIO_SISTEMA',
        resumo: `Convidou usuário do sistema ${inviteEmail.trim()} (${inviteRole})`,
        id_casa: targetCasaId,
        ambiente: userRole?.ambiente || 'producao'
      });

      setSystemUsersCount(prev => prev + 1);
      setInviteMsg({ tipo: 'sucesso', texto: 'Usuário convidado e cadastrado com sucesso!' });
      setInviteNome('');
      setInviteEmail('');
      setTimeout(() => {
        setShowInviteUserModal(false);
        setInviteMsg(null);
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao convidar usuário:', err);
      setInviteMsg({ tipo: 'erro', texto: 'Erro ao cadastrar convite: ' + (err.message || 'Erro no banco.') });
    } finally {
      setSavingInvite(false);
    }
  };

  const [mesSelecionado, setMesSelecionado] = useState(new Date());

  const financeiro = useMemo(() => {
    const currentYear = mesSelecionado.getFullYear();
    const currentMonth = mesSelecionado.getMonth();
    
    return allFinanceiro.filter(f => {
      const d = new Date(f.data);
      const dateStr = f.data.split('T')[0];
      const [year, month] = dateStr.split('-').map(Number);
      
      const matchesDatePart = year === currentYear && (month - 1) === currentMonth;
      const matchesDateObject = d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      
      return matchesDatePart || matchesDateObject;
    });
  }, [allFinanceiro, mesSelecionado]);

  const handleLancamentoRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor) return;
    if (categoriaRapida === 'Mensalidade' && !selectedMembro) {
      alert('Selecione um membro para a mensalidade.');
      return;
    }
    
    if (!userRole?.id_casa && userRole?.role !== 'MASTER') {
      alert('Errot: Usuário não vinculado a nenhuma casa.');
      return;
    }

    try {
      await addDoc('financeiro', {
        tipo: 'Entrada',
        categoria: categoriaRapida,
        valor: parseFloat(valor),
        data: new Date().toISOString(),
        id_membro: selectedMembro || null,
        doador_nome: doadorNome || null,
        descricao: categoriaRapida === 'Doação' ? `Doação de ${doadorNome || 'Anônimo'} via Lançamento Rápido` : 'Contribuição Mensal via Lançamento Rápido',
        modificado_por_email: auth.currentUser?.email || 'Desconhecido',
        id_casa: assumedCasaId || userRole?.id_casa || null,
        ambiente: userRole?.ambiente || 'producao'
      });
      
      await addDoc('audit_logs', {
        data: new Date().toISOString(),
        usuario_email: auth.currentUser?.email || 'Desconhecido',
        acao: 'CRIAR_LANCAMENTO_RAPIDO',
        resumo: `Entrada de R$ ${valor} (${categoriaRapida})`,
        id_casa: assumedCasaId || userRole?.id_casa || null,
        ambiente: userRole?.ambiente || 'producao'
      });

      setSelectedMembro('');
      setValor('');
      setDoadorNome('');
      setCategoriaRapida('Mensalidade');
      alert('Lançamento registrado com sucesso!');
    } catch (error) {
      console.error("Erro ao lançar:", error);
      alert('Erro ao registrar lançamento. Verifique suas permissões.');
    }
  };

  // Cálculos Memoizados para Performance Extrema
  const { entradas, saidas, saldo, doacoes, horasDoadas, chartData, saldoGeralAcumulado } = useMemo(() => {
    // Cálculos do mês atual (financeiro filtrado)
    const ent = financeiro.filter(f => f.tipo === 'Entrada').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const sai = financeiro.filter(f => f.tipo === 'Saída').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const doac = financeiro.filter(f => f.tipo === 'Entrada' && (f.categoria === 'Doação' || f.id_evento)).reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const horas = financeiro.reduce((acc, curr) => acc + (Number(curr.horas_trabalhadas) || 0), 0);
    
    // Cálculo do Saldo Geral Acumulado (todo o histórico)
    const entradasTotais = allFinanceiro.filter(f => f.tipo === 'Entrada').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const saidasTotais = allFinanceiro.filter(f => f.tipo === 'Saída').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const saldoGeral = entradasTotais - saidasTotais;

    return {
      entradas: ent,
      saidas: sai,
      saldo: ent - sai,
      doacoes: doac,
      horasDoadas: horas,
      saldoGeralAcumulado: saldoGeral,
      chartData: [
        { name: 'Entradas', valor: ent, fill: '#10B981' }, // Verde
        { name: 'Saídas', valor: sai, fill: '#EF4444' }    // Vermelho
      ]
    };
  }, [financeiro, allFinanceiro]);

  const { membrosAtivos, inadimplentes, totalInadimplencia, aniversariantes } = useMemo(() => {
    const ativos = membros.filter(m => m.status === 'Ativo');
    
    // Calcula o total pago por cada membro no mês atual
    const pagamentosPorMembro = financeiro
      .filter(f => f.tipo === 'Entrada' && f.id_membro)
      .reduce((acc, curr) => {
        acc[curr.id_membro!] = (acc[curr.id_membro!] || 0) + (Number(curr.valor) || 0);
        return acc;
      }, {} as Record<string, number>);
    
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const diaAtual = hoje.getDate();

    const nivers = ativos.filter(m => {
      if (!m.nascimento) return false;
      const [, mes] = m.nascimento.split('-');
      return parseInt(mes) === mesAtual;
    }).map(m => {
      const [ano, mes, dia] = m.nascimento!.split('-');
      const isHoje = parseInt(dia) === diaAtual;
      const primeiroNome = m.nome.split(' ')[0];
      return { ...m, primeiroNome, dia: parseInt(dia), isHoje };
    }).sort((a, b) => {
      if (a.isHoje && !b.isHoje) return -1;
      if (!a.isHoje && b.isHoje) return 1;
      return a.dia - b.dia;
    });

    // Inadimplentes são aqueles que pagaram menos que a contribuição sugerida
    const listaInadimplentes = ativos.map(m => {
      const totalPago = Number(pagamentosPorMembro[m.id]) || 0;
      const sugerido = Number(m.contribuicao_sugerida) || 0;
      const saldoDevedor = Math.max(0, sugerido - totalPago);
      
      return {
        ...m,
        totalPago,
        saldoDevedor,
        isParcial: totalPago > 0 && saldoDevedor > 0,
        isPendente: totalPago === 0
      };
    }).filter(m => m.saldoDevedor > 0);

    const totalPend = listaInadimplentes.reduce((acc, curr) => acc + (Number(curr.saldoDevedor) || 0), 0);

    return {
      membrosAtivos: ativos,
      inadimplentes: listaInadimplentes,
      totalInadimplencia: totalPend,
      aniversariantes: nivers
    };
  }, [membros, financeiro]);

  const gerarPDFSintetico = async (action: 'download' | 'share' = 'download') => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório Sintético - Ase Connect', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Data de Geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 32);
    
    autoTable(doc, {
      startY: 40,
      head: [['Resumo', 'Valor']],
      body: [
        ['Total de Entradas', `R$ ${entradas.toFixed(2)}`],
        ['Total de Saídas', `R$ ${saidas.toFixed(2)}`],
        ['Saldo Líquido', `R$ ${saldo.toFixed(2)}`],
        ['Horas Doadas', `${horasDoadas}h`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6] }
    });

    if (action === 'download') {
      doc.save('relatorio-sintetico.pdf');
    } else {
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], 'relatorio-sintetico.pdf', { type: 'application/pdf' });
      
      const shareData = {
        title: 'Relatório Sintético',
        text: `*Relatório Sintético - Ase Connect*\nData: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n\nEntradas: R$ ${entradas.toFixed(2)}\nSaídas: R$ ${saidas.toFixed(2)}\nSaldo: R$ ${saldo.toFixed(2)}`,
      };

      if (navigator.share) {
        // Tenta compartilhar com o arquivo se suportado
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({
            ...shareData,
            files: [file],
          }).catch(err => {
            console.error('Erro ao compartilhar arquivo', err);
            // Fallback para texto se o arquivo falhar
            navigator.share(shareData).catch(e => console.error('Erro ao compartilhar texto', e));
          });
        } else {
          // Fallback para texto apenas
          navigator.share(shareData).catch(e => console.error('Erro ao compartilhar texto', e));
        }
      } else {
        // Fallback final para WhatsApp
        window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text)}`, '_blank');
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
            Visão Geral
            {loading && <span className="ml-3 text-xs sm:text-sm font-normal text-slate-400 dark:text-slate-500 animate-pulse">Atualizando...</span>}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Olá, {auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Usuário'}. Bem-vindo(a).</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto flex-wrap sm:flex-nowrap gap-y-2">
          {/* Botão SIST */}
          <button
            type="button"
            onClick={() => setShowCistModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#C59B4B] to-[#a3803d] hover:from-[#a3803d] hover:to-[#836731] text-white rounded-full font-bold text-xs shadow-md transition-all shrink-0 active:scale-95"
            title="Central de Informações do Sistema (Versão, Plano e Convites)"
          >
            <ShieldCheck size={16} className="mr-1.5" />
            SIST
          </button>

          <button
            type="button"
            onClick={() => setIsRelatorioModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-full font-medium text-sm hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors shadow-sm"
          >
            <Download size={16} className="mr-2" />
            Relatório
          </button>
          
          <div className="flex-1 sm:flex-none flex items-center justify-between bg-[#C59B4B]/10 dark:bg-slate-800 border border-[#C59B4B]/20 dark:border-slate-700 rounded-full px-2 py-1 shadow-sm transition-colors">
            <button 
              type="button"
              onClick={() => {
                const prev = new Date(mesSelecionado);
                prev.setMonth(prev.getMonth() - 1);
                setMesSelecionado(prev);
              }} 
              className="p-1 sm:p-1.5 text-[#C59B4B] hover:bg-[#C59B4B]/10 rounded-full transition-colors"
            >
              <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
            </button>
            
            <span className="text-xs sm:text-sm font-bold tracking-wider text-[#C59B4B] px-2 sm:px-4 uppercase mx-auto min-w-[110px] sm:min-w-[130px] text-center">
              {format(mesSelecionado, 'MMMM yyyy', { locale: ptBR })}
            </span>
            
            <button 
              type="button"
              onClick={() => {
                const next = new Date(mesSelecionado);
                const now = new Date();
                if (next.getFullYear() < now.getFullYear() || (next.getFullYear() === now.getFullYear() && next.getMonth() < now.getMonth())) {
                  next.setMonth(next.getMonth() + 1);
                  setMesSelecionado(next);
                }
              }} 
              disabled={mesSelecionado.getMonth() === new Date().getMonth() && mesSelecionado.getFullYear() === new Date().getFullYear()}
              className="p-1 sm:p-1.5 text-[#C59B4B] hover:bg-[#C59B4B]/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
            >
              <ChevronRight size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-start justify-center transition-colors">
          <p className="text-[11px] sm:text-xs leading-tight font-medium text-slate-500 dark:text-slate-400 mb-1">Total Membros</p>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">{membros.length}</h3>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-start justify-center transition-colors">
          <p className="text-[11px] sm:text-xs leading-tight font-medium text-slate-500 dark:text-slate-400 mb-1">Entradas (Mês)</p>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">R$ {entradas.toFixed(2)}</h3>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-start justify-center transition-colors">
          <p className="text-[11px] sm:text-xs leading-tight font-medium text-slate-500 dark:text-slate-400 mb-1">Saídas (Mês)</p>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">R$ {saidas.toFixed(2)}</h3>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-start justify-center transition-colors">
          <p className="text-[11px] sm:text-xs leading-tight font-medium text-slate-500 dark:text-slate-400 mb-1">Saldo do Mês</p>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
            R$ {saldo.toFixed(2)}
          </h3>
        </div>

        <div className="bg-red-50/90 dark:bg-red-950/40 p-3 sm:p-4 rounded-xl shadow-sm border border-red-200 dark:border-red-900/40 flex flex-col items-start justify-center transition-colors">
          <p className="text-[11px] sm:text-xs leading-tight font-medium text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
            <AlertCircle size={12} className="text-red-500" />
            Inadimplência
          </p>
          <h3 className="text-sm sm:text-base font-bold text-red-700 dark:text-red-300">
            R$ {(totalInadimplencia || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <span className="text-[9px] sm:text-[10px] text-red-600/80 dark:text-red-400/80 font-semibold">{inadimplentes.length} pendentes</span>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-start justify-center transition-colors col-span-2 sm:col-span-1 lg:col-span-1">
          <p className="text-[11px] sm:text-xs leading-tight font-medium text-slate-500 dark:text-slate-400 mb-1">Caixa Geral</p>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
            R$ {saldoGeralAcumulado.toFixed(2)}
          </h3>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-start justify-center transition-colors">
          <p className="text-[11px] sm:text-xs leading-tight font-medium text-slate-500 dark:text-slate-400 mb-1">Doações (Mês)</p>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">R$ {doacoes.toFixed(2)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Gráfico */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-2 transition-colors">
          <h3 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 sm:mb-6">Fluxo de Caixa</h3>
          <div className="h-32 sm:h-72 w-full min-h-[128px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:opacity-20" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value}`} tick={{fontSize: 10, fill: '#94A3B8'}} />
                <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']} contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' }} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lançamento Rápido */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center">
            <PlusCircle className="mr-2 text-[#D97706] dark:text-[#FBBF24]" size={20} /> Lançamento Rápido
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">Registre contribuições mensais com 1 clique.</p>
          
          <form onSubmit={handleLancamentoRapido} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
              <div className="relative">
                <select 
                  value={categoriaRapida}
                  onChange={(e) => setCategoriaRapida(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 pr-10 text-sm focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] dark:focus:ring-[#FBBF24] dark:focus:border-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 appearance-none truncate transition-colors"
                >
                  <option value="Mensalidade">Mensalidade</option>
                  <option value="Doação">Doação</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
              </div>
            </div>
            {categoriaRapida === 'Doação' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Doador (Nome)</label>
                <input 
                  type="text" 
                  value={doadorNome}
                  onChange={(e) => setDoadorNome(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] dark:focus:ring-[#FBBF24] dark:focus:border-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
                  placeholder="Nome do doador"
                />
              </div>
            )}
            {categoriaRapida === 'Mensalidade' && (
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Membro</label>
                <div className="relative">
                  <select 
                    value={selectedMembro}
                    onChange={(e) => {
                      setSelectedMembro(e.target.value);
                      const membro = membros.find(m => m.id === e.target.value);
                      if (membro && membro.contribuicao_sugerida) {
                        setValor(membro.contribuicao_sugerida.toString());
                      }
                    }}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 pr-10 text-sm focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] dark:focus:ring-[#FBBF24] dark:focus:border-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 appearance-none truncate transition-colors"
                    required
                  >
                    <option value="">Selecione um membro...</option>
                    {membrosAtivos.map(m => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] dark:focus:ring-[#FBBF24] dark:focus:border-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
                placeholder="0.00"
                required
              />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] dark:from-[#D97706] dark:to-[#B45309] hover:from-[#D97706] hover:to-[#B45309] text-white font-semibold py-2 sm:py-3 rounded-xl transition-all shadow-md">
              Registrar Entrada
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Card de Inadimplência */}
        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden h-fit transition-colors">
          <div className="p-3 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-red-50/50 dark:bg-red-900/10">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 dark:text-red-400 mr-2 shrink-0" size={18} />
              <h3 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-slate-100">Inadimplência do Mês</h3>
            </div>
            <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] sm:text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full inline-flex items-center gap-1.5 self-start sm:self-auto">
              <span>{inadimplentes.length} pendentes</span>
              <span className="opacity-40">•</span>
              <span className="text-red-800 dark:text-red-200">
                R$ {(totalInadimplencia || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </span>
          </div>
          {inadimplentes.length > 0 && (
            <div className="bg-red-50/80 dark:bg-red-950/40 border-b border-red-100 dark:border-red-900/30 px-3 py-2 sm:px-6 sm:py-2.5 flex justify-between items-center text-xs sm:text-sm font-semibold text-red-900 dark:text-red-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Total Pendente de Contribuição:
              </span>
              <span className="font-bold text-sm sm:text-base text-red-700 dark:text-red-400">
                R$ {(totalInadimplencia || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="p-0 max-h-48 sm:max-h-96 overflow-y-auto">
            {inadimplentes.length === 0 ? (
              <div className="p-4 sm:p-8 text-center text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-base">Todos os membros ativos contribuíram este mês! 🎉</div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {inadimplentes.map(m => (
                   <li key={m.id} className="p-3 sm:p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                     <div>
                       <p className="font-medium text-xs sm:text-sm text-slate-800 dark:text-slate-200">{m.nome}</p>
                       <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">{m.telefone || 'Sem telefone'} • {m.profissao || 'Sem profissão'}</p>
                       {m.isParcial && (
                         <span className="inline-block mt-1 bg-\[#C59B4B\]/20 dark:bg-amber-900/30 text-\[#C59B4B\] dark:text-\[#C59B4B\] text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded">
                           PAGAMENTO PARCIAL: R$ {m.totalPago.toFixed(2)}
                         </span>
                       )}
                     </div>
                     <div className="text-right">
                       <p className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400">
                         Falta: R$ {m.saldoDevedor.toFixed(2)}
                       </p>
                       <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500">Total: R$ {m.contribuicao_sugerida?.toFixed(2) || '0.00'}</p>
                     </div>
                   </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Card de Aniversariantes */}
        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden h-fit transition-colors">
          <div className="p-3 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10">
            <div className="flex items-center">
              <Gift className="text-blue-500 dark:text-blue-400 mr-2" size={18} />
              <h3 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-slate-100">Aniversariantes do Mês</h3>
            </div>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-full">
              {aniversariantes.length} neste mês
            </span>
          </div>
          <div className="p-0 max-h-48 sm:max-h-96 overflow-y-auto">
            {aniversariantes.length === 0 ? (
              <div className="p-4 sm:p-8 text-center text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-base">Nenhum aniversariante este mês.</div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {aniversariantes.map(m => (
                  <li key={m.id} className={`p-3 sm:p-4 flex justify-between items-center transition-colors ${m.isHoje ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <div className="flex items-center">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2 sm:mr-3 font-bold text-xs sm:text-sm ${m.isHoje ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                        {m.dia}
                      </div>
                      <div>
                        <p className={`font-bold text-xs sm:text-sm ${m.isHoje ? 'text-blue-700 dark:text-blue-400 sm:text-lg' : 'text-slate-800 dark:text-slate-200'}`}>
                          {m.primeiroNome} {m.isHoje && '🎉'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">{m.nome}</p>
                      </div>
                    </div>
                    {m.isHoje && (
                      <span className="animate-pulse bg-blue-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                        É HOJE!
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Relatório Sintético */}
      {isRelatorioModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center text-slate-800 dark:text-slate-100">
                <FileText className="mr-3 text-[#D97706] dark:text-[#FBBF24]" size={24} />
                <h3 className="text-xl font-bold">Relatório Analítico</h3>
              </div>
              <button onClick={() => setIsRelatorioModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Este relatório contém a listagem detalhada de todas as transações financeiras do mês atual.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    alert('Funcionalidade de PDF Analítico em breve no Dashboard.');
                  }}
                  className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl transition-colors group"
                >
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Download className="text-slate-600 dark:text-slate-400" size={24} />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Baixar PDF</span>
                </button>

                <button
                  onClick={() => gerarPDFSintetico('share')}
                  className="flex flex-col items-center justify-center p-4 bg-[#FFF9E6] dark:bg-amber-900/20 hover:bg-[#FEF3C7] dark:hover:bg-amber-900/40 border border-[#FDE68A] dark:border-\[#C59B4B\]/50 rounded-xl transition-colors group"
                >
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Share2 className="text-[#D97706] dark:text-[#FBBF24]" size={24} />
                  </div>
                  <span className="font-semibold text-[#D97706] dark:text-[#FBBF24]">Compartilhar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal SIST (Informações do Sistema, Plano e Usuários) */}
      {showCistModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center text-slate-800 dark:text-slate-100 gap-2.5">
                <ShieldCheck className="text-\[#C59B4B\] dark:text-amber-400 shrink-0" size={26} />
                <div>
                  <h3 className="text-base font-bold leading-tight">SIST - Central do Sistema</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Status da Licença & Usuários</p>
                </div>
              </div>
              <button onClick={() => setShowCistModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Card de Resumo de Licença */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Versão do Sistema:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">v1.0.4 (Ase Connect)</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Casa de Axé:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{casaInfo.nome}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Plano Escolhido:</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Plano {casaInfo.plano}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCistModal(false);
                        setShowPlanosModal(true);
                      }}
                      className="text-[11px] text-\[#C59B4B\] dark:text-amber-400 font-bold hover:underline bg-\[#C59B4B\]/5 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      Mudar / Upgrade
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Usuários do Sistema:</span>
                  <span className="font-bold text-\[#C59B4B\] dark:text-amber-400 bg-\[#C59B4B\]/5 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    {systemUsersCount} de {getLimitePlanoUsers(casaInfo.plano).max} cadastrados
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Filhos de Santo / Membros:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {membros.length} membros na casa
                  </span>
                </div>
              </div>

              {/* Botão Convidar Usuários dentro do CIST */}
              <button
                onClick={() => {
                  setInviteMsg(null);
                  setShowInviteUserModal(true);
                }}
                className="w-full bg-gradient-to-r from-[#C59B4B] to-[#a3803d] hover:from-[#a3803d] hover:to-[#836731] text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <UserPlus size={18} />
                Convidar Usuários do Sistema
              </button>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center italic leading-relaxed">
                Adicione auxiliares e administradores do sistema para gerenciar seu terreiro conforme o limite estipulado no seu plano.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Convidar Usuário do Sistema */}
      {showInviteUserModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center text-slate-800 dark:text-slate-100 gap-2">
                <UserPlus className="text-\[#C59B4B\] dark:text-amber-400" size={24} />
                <h3 className="text-base font-bold">Convidar Usuário do Sistema</h3>
              </div>
              <button onClick={() => setShowInviteUserModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleConvidarUsuarioSistema} className="p-6 space-y-4 text-xs">
              {/* Info do Limite */}
              {(() => {
                const isGustavoMaster = auth.currentUser?.email === 'gustavomacedo.consultor@gmail.com';
                const planoInfo = getLimitePlanoUsers(casaInfo.plano);
                const limiteAtingido = systemUsersCount >= planoInfo.max;

                if (isGustavoMaster) {
                  return (
                    <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 text-xs flex justify-between items-center">
                      <span className="font-bold">Super Admin Master:</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                        Ilimitado
                      </span>
                    </div>
                  );
                }

                return (
                  <div className={`p-3 rounded-xl border text-xs flex justify-between items-center ${limiteAtingido ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300' : 'bg-\[#C59B4B\]/5 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'}`}>
                    <div>
                      <span className="font-bold">Plano {planoInfo.nome}:</span> {systemUsersCount} de {planoInfo.max} usuários
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${limiteAtingido ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-100' : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100'}`}>
                      {limiteAtingido ? 'Limite Atingido' : `${planoInfo.max - systemUsersCount} Restantes`}
                    </span>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Mãe Maria / Auxiliar João"
                  value={inviteNome}
                  onChange={(e) => setInviteNome(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-\[#C59B4B\] bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">E-mail do Usuário</label>
                <input
                  type="email"
                  placeholder="usuario@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-\[#C59B4B\] bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cargo / Função no Sistema</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-\[#C59B4B\] bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                >
                  <option value={Role.EDITOR}>EDITOR (Acesso padrão de gestão)</option>
                  <option value={Role.ADMIN_CASA}>ADMIN_CASA (Gestor da Casa)</option>
                  <option value={Role.TESTADOR}>TESTADOR (Acesso restrito a testes)</option>
                </select>
              </div>

              {inviteMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold leading-snug ${inviteMsg.tipo === 'erro' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {inviteMsg.texto}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteUserModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingInvite}
                  className="flex-1 bg-gradient-to-r from-[#C59B4B] to-[#a3803d] hover:from-[#a3803d] hover:to-[#836731] text-white py-3 rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {savingInvite ? 'Salvando...' : 'Enviar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mudar / Upgrade de Plano */}
      <Modal
        isOpen={showPlanosModal}
        onClose={() => setShowPlanosModal(false)}
        title="Escolher / Alterar Plano de Assinatura"
        maxWidth="2xl"
      >
        <div className="text-center mb-6 max-w-lg mx-auto">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Planos de Assinatura Asè Connect</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sua Casa de Axé está atualmente no <strong className="text-emerald-600 dark:text-emerald-400 font-black uppercase">Plano {casaInfo.plano}</strong>. Selecione um plano abaixo para realizar Upgrade ou Downgrade.
          </p>
        </div>
        <PlanosCards onSelectPlano={handleSelectPlanoFromDashboard} />
      </Modal>
    </div>
  );
}
