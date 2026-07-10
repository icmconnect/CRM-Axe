import React, { useState, useMemo } from 'react';
import { addDoc } from '../lib/firestore';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useUser } from '../contexts/UserContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, TrendingUp, TrendingDown, PlusCircle, Wallet, Gift, FileText, Download, Share2, X, User, Clock, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const { userRole } = useAuth();
  
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
        id_casa: userRole?.id_casa || null,
        ambiente: userRole?.ambiente || 'producao'
      });
      
      await addDoc('audit_logs', {
        data: new Date().toISOString(),
        usuario_email: auth.currentUser?.email || 'Desconhecido',
        acao: 'CRIAR_LANCAMENTO_RAPIDO',
        resumo: `Entrada de R$ ${valor} (${categoriaRapida})`,
        id_casa: userRole?.id_casa || null,
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
    const ent = financeiro.filter(f => f.tipo === 'Entrada').reduce((acc, curr) => acc + curr.valor, 0);
    const sai = financeiro.filter(f => f.tipo === 'Saída').reduce((acc, curr) => acc + curr.valor, 0);
    const doac = financeiro.filter(f => f.tipo === 'Entrada' && (f.categoria === 'Doação' || f.id_evento)).reduce((acc, curr) => acc + curr.valor, 0);
    const horas = financeiro.reduce((acc, curr) => acc + (Number(curr.horas_trabalhadas) || 0), 0);
    
    // Cálculo do Saldo Geral Acumulado (todo o histórico)
    const entradasTotais = allFinanceiro.filter(f => f.tipo === 'Entrada').reduce((acc, curr) => acc + curr.valor, 0);
    const saidasTotais = allFinanceiro.filter(f => f.tipo === 'Saída').reduce((acc, curr) => acc + curr.valor, 0);
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

  const { membrosAtivos, inadimplentes, aniversariantes } = useMemo(() => {
    const ativos = membros.filter(m => m.status === 'Ativo');
    
    // Calcula o total pago por cada membro no mês atual
    const pagamentosPorMembro = financeiro
      .filter(f => f.tipo === 'Entrada' && f.id_membro)
      .reduce((acc, curr) => {
        acc[curr.id_membro!] = (acc[curr.id_membro!] || 0) + curr.valor;
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
      const totalPago = pagamentosPorMembro[m.id] || 0;
      const sugerido = m.contribuicao_sugerida || 0;
      const saldoDevedor = sugerido - totalPago;
      
      return {
        ...m,
        totalPago,
        saldoDevedor,
        isParcial: totalPago > 0 && saldoDevedor > 0,
        isPendente: totalPago === 0
      };
    }).filter(m => m.saldoDevedor > 0);

    return {
      membrosAtivos: ativos,
      inadimplentes: listaInadimplentes,
      aniversariantes: nivers
    };
  }, [membros, financeiro]);

  const gerarPDFSintetico = async (action: 'download' | 'share' = 'download') => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Relatório Sintético - Portal dos Sacerdotes', 14, 22);
    
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
        text: `*Relatório Sintético - Portal dos Sacerdotes*\nData: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n\nEntradas: R$ ${entradas.toFixed(2)}\nSaídas: R$ ${saidas.toFixed(2)}\nSaldo: R$ ${saldo.toFixed(2)}`,
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
            Visão Geral
            {loading && <span className="ml-3 text-xs sm:text-sm font-normal text-slate-400 dark:text-slate-500 animate-pulse">Atualizando...</span>}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Olá, {auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Usuário'}. Bem-vindo(a).</p>
        </div>
        <div className="flex items-center bg-[#FFF9E6] dark:bg-slate-800 border border-[#FDE68A] dark:border-slate-700 rounded-full px-2 py-1 shadow-sm transition-colors">
          <button 
            type="button"
            onClick={() => {
              const prev = new Date(mesSelecionado);
              prev.setMonth(prev.getMonth() - 1);
              setMesSelecionado(prev);
            }} 
            className="p-1 sm:p-1.5 text-[#D97706] dark:text-[#FBBF24] hover:bg-[#FDE68A] dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
          </button>
          
          <span className="text-xs sm:text-sm font-bold tracking-wider text-[#D97706] dark:text-[#FBBF24] px-2 sm:px-4 uppercase mx-auto min-w-[110px] sm:min-w-[130px] text-center">
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
            className="p-1 sm:p-1.5 text-[#D97706] dark:text-[#FBBF24] hover:bg-[#FDE68A] dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
          >
            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left transition-colors">
          <div className="mb-1 sm:mb-0">
            <p className="text-[10px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Total Membros</p>
            <h3 className="text-sm sm:text-2xl font-bold text-slate-800 dark:text-slate-100">{membros.length}</h3>
          </div>
          <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 dark:bg-slate-700 rounded-full items-center justify-center text-slate-600 dark:text-slate-300">
            <User size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left transition-colors">
          <div className="mb-1 sm:mb-0">
            <p className="text-[10px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Entradas (Mês)</p>
            <h3 className="text-sm sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">R$ {entradas.toFixed(2)}</h3>
          </div>
          <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-full items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left transition-colors">
          <div className="mb-1 sm:mb-0">
            <p className="text-[10px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Saídas (Mês)</p>
            <h3 className="text-sm sm:text-2xl font-bold text-red-600 dark:text-red-400">R$ {saidas.toFixed(2)}</h3>
          </div>
          <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-900/30 rounded-full items-center justify-center text-red-600 dark:text-red-400">
            <TrendingDown size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left transition-colors">
          <div className="mb-1 sm:mb-0">
            <p className="text-[10px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Saldo do Mês</p>
            <h3 className={`text-sm sm:text-2xl font-bold ${saldo >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-red-600 dark:text-red-400'}`}>
              R$ {saldo.toFixed(2)}
            </h3>
          </div>
          <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 bg-[#FFF9E6] dark:bg-amber-900/30 rounded-full items-center justify-center text-[#D97706] dark:text-amber-500">
            <Wallet size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-slate-800 dark:bg-slate-900 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-700 dark:border-slate-800 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left col-span-2 sm:col-span-2 transition-colors">
          <div className="mb-1 sm:mb-0">
            <p className="text-[10px] sm:text-sm font-medium text-slate-400 dark:text-slate-500 mb-0.5 sm:mb-1">Caixa Geral (Acumulado)</p>
            <h3 className={`text-sm sm:text-2xl font-bold ${saldoGeralAcumulado >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              R$ {saldoGeralAcumulado.toFixed(2)}
            </h3>
          </div>
          <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 bg-slate-700 dark:bg-slate-800 rounded-full items-center justify-center text-white">
            <Wallet size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left transition-colors">
          <div className="mb-1 sm:mb-0">
            <p className="text-[10px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Doações (Mês)</p>
            <h3 className="text-sm sm:text-2xl font-bold text-blue-600 dark:text-blue-400">R$ {doacoes.toFixed(2)}</h3>
          </div>
          <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full items-center justify-center text-blue-600 dark:text-blue-400">
            <Gift size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left transition-colors">
          <div className="mb-1 sm:mb-0">
            <p className="text-[10px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-1">Horas Doadas</p>
            <h3 className="text-sm sm:text-2xl font-bold text-[#D97706] dark:text-amber-500">{horasDoadas}h</h3>
          </div>
          <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 dark:bg-amber-900/30 rounded-full items-center justify-center text-[#D97706] dark:text-amber-500">
            <Clock size={20} className="sm:w-6 sm:h-6" />
          </div>
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
          <div className="p-3 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-red-50/50 dark:bg-red-900/10">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 dark:text-red-400 mr-2" size={18} />
              <h3 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-slate-100">Inadimplência do Mês</h3>
            </div>
            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-full">
              {inadimplentes.length} pendentes
            </span>
          </div>
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
                         <span className="inline-block mt-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded">
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
                  className="flex flex-col items-center justify-center p-4 bg-[#FFF9E6] dark:bg-amber-900/20 hover:bg-[#FEF3C7] dark:hover:bg-amber-900/40 border border-[#FDE68A] dark:border-amber-700/50 rounded-xl transition-colors group"
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
    </div>
  );
}
