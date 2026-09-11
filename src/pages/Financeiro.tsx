import React, { useState, useMemo, useRef } from 'react';
import { addDoc } from '../lib/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Financeiro as IFinanceiro } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Upload, FileText, ArrowUpCircle, ArrowDownCircle, Search, Clock, Edit2, ChevronDown, Share2, FileBarChart, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { extrairDadosComprovante } from '../services/geminiService';
import { validarLancamentoFinanceiro, formatarErros } from '../utils/validators';

export default function Financeiro() {
  const { financeiro: transacoes, membros, loading } = useData();
  const { userRole, assumedCasaId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [mesSelecionado, setMesSelecionado] = useState<Date>(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<IFinanceiro>>({
    tipo: 'Entrada',
    categoria: 'Mensalidade',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    id_membro: '',
    horas_trabalhadas: 0,
    comprovanteUrl: ''
  });

  const currentMonth = mesSelecionado.getMonth();
  const currentYear = mesSelecionado.getFullYear();

  // Transações filtradas pelo mês selecionado
  const transacoesDoMes = useMemo(() => {
    return transacoes.filter(f => {
      if (!f.data) return false;
      const d = new Date(f.data);
      const dateStr = typeof f.data === 'string' ? f.data.split('T')[0] : '';
      if (dateStr && dateStr.includes('-')) {
        const [year, month] = dateStr.split('-').map(Number);
        if (year === currentYear && (month - 1) === currentMonth) return true;
      }
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [transacoes, currentMonth, currentYear]);

  const filteredTransacoes = useMemo(() => {
    return transacoesDoMes.filter(t => 
      (t.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transacoesDoMes, searchTerm]);

  // Report & Totals Calculations
  const totalReceitas = useMemo(() => transacoesDoMes.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + (Number(t.valor) || 0), 0), [transacoesDoMes]);
  const totalDespesas = useMemo(() => transacoesDoMes.filter(t => t.tipo === 'Saída').reduce((acc, t) => acc + (Number(t.valor) || 0), 0), [transacoesDoMes]);
  const saldo = totalReceitas - totalDespesas;

  const totalGeralAcumulado = useMemo(() => {
    const ent = transacoes.filter(t => t.tipo === 'Entrada').reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
    const sai = transacoes.filter(t => t.tipo === 'Saída').reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
    return ent - sai;
  }, [transacoes]);

  const inadimplentes = useMemo(() => membros.filter(m => {
    return m.status === 'Ativo' && !transacoesDoMes.some(f => 
      f.id_membro === m.id && 
      f.tipo === 'Entrada'
    );
  }), [membros, transacoesDoMes]);

  const aReceber = useMemo(() => inadimplentes.reduce((acc, m) => acc + (Number(m.contribuicao_sugerida) || 0), 0), [inadimplentes]);

  const createPDFBlob = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    const mesNome = format(mesSelecionado, 'MMMM yyyy', { locale: ptBR });
    doc.text(`Relatório Financeiro - ${mesNome.toUpperCase()}`, 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    doc.text(`Total Receitas (${mesNome}): R$ ${(Number(totalReceitas) || 0).toFixed(2)}`, 14, 40);
    doc.text(`Total Despesas (${mesNome}): R$ ${(Number(totalDespesas) || 0).toFixed(2)}`, 14, 48);
    doc.text(`Saldo do Mês: R$ ${(Number(saldo) || 0).toFixed(2)}`, 14, 56);
    doc.text(`Saldo Geral Acumulado: R$ ${(Number(totalGeralAcumulado) || 0).toFixed(2)}`, 14, 64);
    doc.text(`A Receber (Inadimplentes): R$ ${(Number(aReceber) || 0).toFixed(2)}`, 14, 72);

    autoTable(doc, {
      startY: 80,
      head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
      body: transacoesDoMes.map(t => [
        new Date(t.data).toLocaleDateString('pt-BR'),
        t.descricao || '',
        t.categoria || '',
        t.tipo || '',
        `R$ ${(Number(t.valor) || 0).toFixed(2)}`
      ]),
    });

    return doc.output('blob');
  };

  const handleOpenPDF = async () => {
    const blob = await createPDFBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleSharePDF = async () => {
    const blob = await createPDFBlob();
    const file = new File([blob], "relatorio_financeiro.pdf", { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: 'Relatório Financeiro',
        text: 'Segue o relatório financeiro consolidado.'
      }).catch(console.error);
    } else {
      alert('O compartilhamento nativo não é suportado neste dispositivo.');
    }
  };

  const handleEdit = (t: IFinanceiro) => {
    setEditingId(t.id);
    setFormData({
      tipo: t.tipo,
      categoria: t.categoria,
      valor: t.valor,
      data: t.data ? (typeof t.data === 'string' ? t.data.split('T')[0] : new Date(t.data as any).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      descricao: t.descricao,
      id_membro: t.id_membro || '',
      horas_trabalhadas: t.horas_trabalhadas || 0,
      comprovanteUrl: t.comprovanteUrl || ''
    });
    setIsModalOpen(true);
  };

  const prepararEValidarLancamento = async (
    currentFormData: typeof formData,
    currentSaldo: number,
    currentEditingId: string | null,
    currentTransacoes: IFinanceiro[]
  ): Promise<{ sucesso: boolean; dados?: any; erro?: string }> => {
    try {
      const now = new Date();
      let finalDate = now.toISOString();
      
      if (currentFormData.data) {
        const [y, m, d] = currentFormData.data.split('-').map(Number);
        const selectedDate = new Date(y, m - 1, d);
        
        // Se for a data de hoje, mantém o horário atual
        if (currentFormData.data === now.toISOString().split('T')[0]) {
          selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        } else {
          // Se for outra data, define para meio-dia para evitar shifts de fuso horário
          selectedDate.setHours(12, 0, 0);
        }
        finalDate = selectedDate.toISOString();
      }

      // VALIDAÇÃO DE SEGURANÇA: Bloquear se não houver id_casa (exceto MASTER)
      if (!userRole?.id_casa && userRole?.role !== 'MASTER') {
         return { sucesso: false, erro: 'Erro: Usuário não vinculado a nenhuma casa. Contate o administrador.' };
      }

      const transacaoData: any = {
        ...currentFormData,
        valor: Number(currentFormData.valor) || 0,
        horas_trabalhadas: Number(currentFormData.horas_trabalhadas) || 0,
        data: finalDate,
        modificado_por_email: auth.currentUser?.email || 'Desconhecido',
        id_casa: assumedCasaId || userRole?.id_casa || null,
        ambiente: userRole?.ambiente || 'producao'
      };

      // Limpar campos undefined para evitar erros no Firestore
      Object.keys(transacaoData).forEach(key => {
        if (transacaoData[key] === undefined) {
          delete transacaoData[key];
        }
      });

      // Validação dos dados com base no saldo disponível
      const saldoMax = currentEditingId 
        ? (currentSaldo + (currentTransacoes.find(t => t.id === currentEditingId && t.tipo === 'Saída')?.valor || 0))
        : currentSaldo;

      const validacao = validarLancamentoFinanceiro(
        {
          tipo: transacaoData.tipo,
          categoria: transacaoData.categoria || '',
          valor: transacaoData.valor,
          descricao: transacaoData.descricao || '',
          data: transacaoData.data
        },
        saldoMax
      );

      if (!validacao.valido) {
        return { sucesso: false, erro: formatarErros(validacao.erros) };
      }

      // Adiciona console.log estratégico (apenas em desenvolvimento) para auditoria de saldo
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `[AUDITORIA FINANCEIRA] Lançamento Iniciado. Saldo anterior: R$ ${currentSaldo.toFixed(2)}. ` +
          `Valor: R$ ${transacaoData.valor.toFixed(2)} (${transacaoData.tipo}). ` +
          `Saldo virtual máximo permitido para validação de saídas: R$ ${saldoMax.toFixed(2)}.`
        );
      }

      return { sucesso: true, dados: transacaoData };
    } catch (err: any) {
      return { sucesso: false, erro: err.message || 'Erro inesperado na validação.' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validacao = await prepararEValidarLancamento(formData, saldo, editingId, transacoes);

      if (!validacao.sucesso) {
        alert(`Erros de validação:\n${validacao.erro}`);
        return;
      }

      const transacaoData = validacao.dados;

      if (editingId) {
        await updateDoc(doc(db, 'financeiro', editingId), transacaoData);
        await addDoc('audit_logs', {
          data: new Date().toISOString(),
          usuario_email: auth.currentUser?.email || 'Desconhecido',
          acao: 'EDITAR_LANCAMENTO',
          resumo: `Editado: ${transacaoData.tipo} de R$ ${transacaoData.valor} - ${transacaoData.categoria}`
        });
      } else {
        await addDoc('financeiro', transacaoData);
        await addDoc('audit_logs', {
          data: new Date().toISOString(),
          usuario_email: auth.currentUser?.email || 'Desconhecido',
          acao: 'CRIAR_LANCAMENTO',
          resumo: `${transacaoData.tipo} de R$ ${transacaoData.valor} - ${transacaoData.categoria}`
        });
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ tipo: 'Entrada', categoria: 'Mensalidade', valor: 0, data: new Date().toISOString().split('T')[0], descricao: '', id_membro: '', horas_trabalhadas: 0, comprovanteUrl: '' });
    } catch (error: any) {
      console.error("Erro ao salvar lançamento:", error);
      alert(`Erro ao salvar: ${error.message || 'Verifique suas permissões.'}`);
    }
  };

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    let url = '';
    try {
      // 1. Upload para o Firebase Storage
      const storageRef = ref(storage, `comprovantes/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      url = await getDownloadURL(storageRef);

      // 2. Chamar o serviço Gemini OCR integrado
      const data = await extrairDadosComprovante(file);
      
      setFormData(prev => ({
        ...prev,
        valor: data.valor || 0,
        data: data.data || new Date().toISOString().split('T')[0],
        descricao: `Comprovante: ${data.descricao || 'Lançamento via OCR'}`,
        comprovanteUrl: url,
        tipo: 'Entrada' // Assume entrada por padrão para comprovantes
      }));
      setIsModalOpen(true);
    } catch (error: any) {
      console.error("Erro no OCR:", error);
      alert(`Não foi possível extrair os dados automaticamente: ${error.message || error}. Preencha manualmente.`);
      // Se já tiver subido o arquivo, let's keep the url
      setFormData(prev => ({ ...prev, comprovanteUrl: url }));
      setIsModalOpen(true);
    } finally {
      setIsOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Financeiro
            {loading && <span className="ml-3 text-sm font-normal text-slate-400 dark:text-slate-500 animate-pulse">Atualizando...</span>}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Lançamentos podem ser editados para correção de erros.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleOcrUpload} 
          />
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl flex items-center font-semibold shadow-sm transition-colors flex-1 sm:flex-none justify-center"
          >
            <FileBarChart size={20} className="mr-2 text-[#D97706] dark:text-[#FBBF24]" /> Relatório
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isOcrLoading}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl flex items-center font-semibold shadow-sm transition-colors flex-1 sm:flex-none justify-center disabled:opacity-50"
          >
            {isOcrLoading ? <span className="animate-pulse">Lendo...</span> : <><Upload size={20} className="mr-2 text-[#D97706] dark:text-[#FBBF24]" /> Ler Comprovante (IA)</>}
          </button>
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ tipo: 'Entrada', categoria: 'Mensalidade', valor: 0, data: new Date().toISOString().split('T')[0], descricao: '', id_membro: '', horas_trabalhadas: 0, comprovanteUrl: '' });
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] dark:from-[#D97706] dark:to-[#B45309] hover:from-[#D97706] hover:to-[#B45309] text-white px-5 py-2.5 rounded-xl flex items-center font-semibold shadow-md transition-all flex-1 sm:flex-none justify-center"
          >
            <Plus size={20} className="mr-2" /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Navegação por Mês & Resumo do Mês */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-[#D97706] dark:text-[#FBBF24]" size={20} />
            <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              Lançamentos do Mês
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#FFF9E6] dark:bg-slate-900 border border-[#FDE68A] dark:border-slate-700 rounded-full px-3 py-1.5 shadow-sm">
            <button 
              type="button"
              onClick={() => {
                const prev = new Date(mesSelecionado);
                prev.setMonth(prev.getMonth() - 1);
                setMesSelecionado(prev);
              }} 
              className="p-1 text-[#D97706] dark:text-[#FBBF24] hover:bg-[#FDE68A] dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Mês Anterior"
            >
              <ChevronLeft size={18} />
            </button>
            
            <span className="text-xs sm:text-sm font-bold tracking-wider text-[#D97706] dark:text-[#FBBF24] px-3 uppercase min-w-[130px] text-center">
              {format(mesSelecionado, 'MMMM yyyy', { locale: ptBR })}
            </span>
            
            <button 
              type="button"
              onClick={() => {
                const next = new Date(mesSelecionado);
                next.setMonth(next.getMonth() + 1);
                setMesSelecionado(next);
              }} 
              className="p-1 text-[#D97706] dark:text-[#FBBF24] hover:bg-[#FDE68A] dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Próximo Mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Resumo Financeiro do Mês Selecionado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Entradas (Mês)</p>
            <p className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300">R$ {totalReceitas.toFixed(2)}</p>
          </div>
          <div className="bg-red-50/60 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
            <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase">Saídas (Mês)</p>
            <p className="text-sm sm:text-base font-black text-red-700 dark:text-red-300">R$ {totalDespesas.toFixed(2)}</p>
          </div>
          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
            <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase">Saldo do Mês</p>
            <p className={`text-sm sm:text-base font-black ${saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>R$ {saldo.toFixed(2)}</p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-700/60 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">Caixa Acumulado</p>
            <p className={`text-sm sm:text-base font-black ${totalGeralAcumulado >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-red-600 dark:text-red-400'}`}>R$ {totalGeralAcumulado.toFixed(2)}</p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative pt-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder={`Buscar lançamentos em ${format(mesSelecionado, 'MMMM yyyy', { locale: ptBR })}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
          />
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700/50">
            <thead className="bg-slate-50 dark:bg-slate-900/50 transition-colors">
              <tr>
                <th className="px-2 sm:px-6 py-2 text-left text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-2 sm:px-6 py-2 text-left text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Descrição</th>
                <th className="px-2 sm:px-6 py-2 text-left text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:table-cell">Categoria</th>
                <th className="px-2 sm:px-6 py-2 text-right text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Valor</th>
                <th className="px-2 sm:px-6 py-2 text-right text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-50 dark:divide-slate-700/50">
              {filteredTransacoes.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-2 sm:px-6 py-2 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">
                    {format(new Date(t.data), 'dd/MM/yy', { locale: ptBR })}
                  </td>
                  <td className="px-2 sm:px-6 py-2">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mr-2 ${t.tipo === 'Entrada' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                        {t.tipo === 'Entrada' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight truncate max-w-[100px] sm:max-w-none uppercase tracking-tight">{t.descricao}</p>
                        {t.id_membro && (
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-[100px] sm:max-w-none">
                            {membros.find(m => m.id === t.id_membro)?.nome}
                          </p>
                        )}
                        {t.horas_trabalhadas ? (
                          <p className="text-[9px] text-[#D97706] dark:text-[#FBBF24] flex items-center mt-0.5 font-bold">
                            <Clock size={9} className="mr-1"/> {t.horas_trabalhadas}h doadas
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 sm:px-6 py-2 whitespace-nowrap hidden md:table-cell">
                    <span className="px-1.5 py-0.5 inline-flex text-[9px] leading-3 font-bold rounded-md bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700">
                      {t.categoria}
                    </span>
                  </td>
                  <td className={`px-2 sm:px-6 py-2 whitespace-nowrap text-[11px] font-black text-right ${t.tipo === 'Entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.tipo === 'Entrada' ? '+' : '-'} R$ {t.valor.toFixed(2)}
                  </td>
                  <td className="px-2 sm:px-6 py-2 whitespace-nowrap text-right">
                    <button onClick={() => handleEdit(t)} aria-label="Editar Lançamento" className="text-slate-300 dark:text-slate-500 hover:text-[#D97706] dark:hover:text-[#FBBF24] p-1 transition-colors">
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransacoes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 border-dashed border-b-0">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] transition-colors">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <FileText className="mr-2 text-[#D97706] dark:text-[#FBBF24]" size={24} /> {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h3>
            </div>
            
            <div className="p-3 sm:p-4 overflow-y-auto flex-1">
              <form id="financeiro-form" onSubmit={handleSubmit} className="space-y-3">
                
                {formData.comprovanteUrl && (
                  <div className="mb-3 p-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg flex items-center text-emerald-700 dark:text-emerald-400 text-xs transition-colors">
                    <Upload size={14} className="mr-2" /> Comprovante anexado via IA.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">Tipo *</label>
                    <div className="relative">
                      <select required value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value as 'Entrada' | 'Saída'})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 pr-10 text-sm focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 appearance-none truncate transition-colors">
                        <option value="Entrada">Entrada (Receita)</option>
                        <option value="Saída">Saída (Despesa)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">Data *</label>
                    <input type="date" required value={formData.data || ''} onChange={e => setFormData({...formData, data: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">Valor (R$) *</label>
                    <input type="number" step="0.01" required value={formData.valor ?? ''} onChange={e => setFormData({...formData, valor: parseFloat(e.target.value) || 0})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors" />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">Categoria *</label>
                    <div className="relative">
                      <select required value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 pr-10 text-sm focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 appearance-none truncate transition-colors">
                        <option value="">Selecione...</option>
                        <option value="Mensalidade">Mensalidade</option>
                        <option value="Doação">Doação</option>
                        <option value="Evento">Evento</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Materiais">Materiais</option>
                        <option value="Estorno">Estorno</option>
                        <option value="Outros">Outros</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">Descrição *</label>
                    <input type="text" required value={formData.descricao || ''} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors" placeholder="Ex: Mensalidade de João, Compra de Velas..." />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">Vincular Membro (Opcional)</label>
                    <div className="relative">
                      <select value={formData.id_membro || ''} onChange={e => setFormData({...formData, id_membro: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 pr-10 text-sm focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 appearance-none truncate transition-colors">
                        <option value="">Nenhum</option>
                        {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-0.5">Doação de Serviços (Horas)</label>
                    <input type="number" step="0.5" value={formData.horas_trabalhadas ?? ''} onChange={e => setFormData({...formData, horas_trabalhadas: parseFloat(e.target.value) || 0})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors" placeholder="Ex: 4.5" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700 flex-shrink-0 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[2rem] transition-colors">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors">
                Cancelar
              </button>
              <button type="submit" form="financeiro-form" className="px-5 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] dark:from-[#D97706] dark:to-[#B45309] text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                {editingId ? 'Salvar Alterações' : 'Registrar Lançamento'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Relatório */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh] transition-colors">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex-shrink-0 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <FileBarChart className="mr-2 text-[#D97706] dark:text-[#FBBF24]" /> Relatório Consolidado
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                &times;
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-emerald-900/20 border border-green-100 dark:border-emerald-800/50 p-4 rounded-2xl transition-colors">
                  <p className="text-sm text-green-600 dark:text-emerald-400 font-medium mb-1">Total Receitas</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-emerald-500">
                    R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 p-4 rounded-2xl transition-colors">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Total Despesas</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-500">
                    R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-4 rounded-2xl transition-colors">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Saldo Atual</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-500">
                    R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-amber-900/20 border border-yellow-100 dark:border-amber-800/50 p-4 rounded-2xl transition-colors">
                <p className="text-sm text-yellow-700 dark:text-amber-500 font-medium mb-1">A Receber (Inadimplentes - Mês Atual)</p>
                <p className="text-2xl font-bold text-yellow-800 dark:text-amber-600">
                  R$ {aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-yellow-600 dark:text-amber-500/70 mt-1">
                  Baseado na contribuição sugerida de {inadimplentes.length} membro(s) pendente(s).
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700 flex-shrink-0 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[2rem] transition-colors">
              <button 
                onClick={handleSharePDF} 
                className="px-5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors flex items-center"
              >
                <Share2 size={18} className="mr-2" /> Compartilhar
              </button>
              <button 
                onClick={handleOpenPDF} 
                className="px-5 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] dark:from-[#D97706] dark:to-[#B45309] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center"
              >
                <FileText size={18} className="mr-2" /> Abrir PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
