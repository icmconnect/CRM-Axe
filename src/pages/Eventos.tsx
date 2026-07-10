import React, { useState, useMemo } from 'react';
import { addDoc } from '../lib/firestore';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { validarEvento, validarLancamentoFinanceiro, formatarErros } from '../utils/validators';
import { db, auth } from '../firebase';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { Evento, Financeiro as IFinanceiro, ItemNecessidade, Membro } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Plus, Trophy, ArrowLeft, CheckCircle2, Circle, Trash2, DollarSign, ArrowUpCircle, ArrowDownCircle, Printer, Share2, Download, ChevronDown } from 'lucide-react';
import { gerarPDF } from '../utils/pdfGenerator';

export default function Eventos() {
  const { eventos, financeiro, itens, membros, loading } = useData();
  const { userRole } = useAuth();
  
  const [selectedEventoId, setSelectedEventoId] = useState<string | null>(null);
  
  // Modals
  const [isNewEventoModalOpen, setIsNewEventoModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isNewFinModalOpen, setIsNewFinModalOpen] = useState(false);

  // Forms
  const [eventoForm, setEventoForm] = useState({ nome: '', data: '', meta_financeira: 0 });
  const [itemForm, setItemForm] = useState({ nome: '', quantidade: 1, unidade: 'un', id_membro_doador: '' });
  const [finForm, setFinForm] = useState({ tipo: 'Entrada', valor: 0, descricao: '', data: new Date().toISOString().split('T')[0], doador_nome: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saldoGlobal = useMemo(() => {
    return financeiro.filter(f => f.tipo === 'Entrada').reduce((sum, f) => sum + f.valor, 0) -
           financeiro.filter(f => f.tipo === 'Saída').reduce((sum, f) => sum + f.valor, 0);
  }, [financeiro]);

  const handleCreateEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validacao = validarEvento(eventoForm);
    if (!validacao.valido) {
      alert(`Erros de validação:\n${formatarErros(validacao.erros)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc('eventos', {
        ...eventoForm,
        status: 'Aberto',
        id_casa: userRole?.id_casa || null,
        ambiente: userRole?.ambiente || 'producao',
        criado_por_email: auth.currentUser?.email
      });
      setIsNewEventoModalOpen(false);
      setEventoForm({ nome: '', data: '', meta_financeira: 0 });
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      alert("Erro ao criar evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventoId) return;
    setIsSubmitting(true);
    try {
      await addDoc('itens_necessidade', {
        ...itemForm,
        id_evento: selectedEventoId,
        concluido: !!itemForm.id_membro_doador,
        id_casa: userRole?.id_casa || null,
        ambiente: userRole?.ambiente || 'producao'
      });
      setIsNewItemModalOpen(false);
      setItemForm({ nome: '', quantidade: 1, unidade: 'un', id_membro_doador: '' });
    } catch (error) {
      console.error("Erro ao criar item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventoId) return;

    const validacao = validarLancamentoFinanceiro({
      tipo: finForm.tipo as 'Entrada' | 'Saída' | 'Serviço',
      categoria: 'Evento',
      valor: finForm.valor,
      descricao: finForm.descricao,
      data: finForm.data
    }, saldoGlobal);

    if (!validacao.valido) {
      alert(`Erros de validação:\n${formatarErros(validacao.erros)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc('financeiro', {
        ...finForm,
        categoria: 'Evento',
        id_evento: selectedEventoId, // Vinculando ao evento
        modificado_por_email: auth.currentUser?.email || 'Desconhecido',
        data: new Date(finForm.data).toISOString(),
        id_casa: userRole?.id_casa || null,
        ambiente: userRole?.ambiente || 'producao'
      });
      setIsNewFinModalOpen(false);
      setFinForm({ tipo: 'Entrada', valor: 0, descricao: '', data: new Date().toISOString().split('T')[0], doador_nome: '' });
    } catch (error) {
      console.error("Erro ao criar lançamento:", error);
      alert("Erro ao criar lançamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleItemStatus = async (item: ItemNecessidade) => {
    try {
      await updateDoc(doc(db, 'itens_necessidade', item.id), {
        concluido: !item.concluido
      });
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
    }
  };

  const deleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await deleteDoc(doc(db, 'itens_necessidade', id));
      } catch (error) {
        console.error("Erro ao excluir item:", error);
      }
    }
  };

  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [newMeta, setNewMeta] = useState(0);

  const handleUpdateMeta = async (eventoId: string) => {
    try {
      await updateDoc(doc(db, 'eventos', eventoId), {
        meta_financeira: newMeta
      });
      setIsEditingMeta(false);
    } catch (error) {
      console.error("Erro ao atualizar meta:", error);
    }
  };

  const gerarPDFEvento = async (evento: Evento, eventoItens: ItemNecessidade[], eventoFin: IFinanceiro[], action: 'download' | 'share' = 'download') => {
    try {
      const arrecadado = eventoFin.filter(f => f.tipo === 'Entrada').reduce((acc, curr) => acc + curr.valor, 0);
      const gasto = eventoFin.filter(f => f.tipo === 'Saída').reduce((acc, curr) => acc + curr.valor, 0);
      const saldo = arrecadado - gasto;

      const summaryFields = [
        { label: 'Data do Evento', value: format(new Date(evento.data), "dd/MM/yyyy") },
        { label: 'Meta Financeira', value: `R$ ${evento.meta_financeira.toFixed(2)}` },
        { label: 'Total Arrecadado', value: `R$ ${arrecadado.toFixed(2)}` },
        { label: 'Total Gasto', value: `R$ ${gasto.toFixed(2)}` },
        { label: 'Saldo Atual', value: `R$ ${saldo.toFixed(2)}` }
      ];

      const itensHeaders = [['Item', 'Quantidade', 'Status', 'Doador']];
      const itensBody = eventoItens.map(item => [
        item.nome,
        `${item.quantidade} ${item.unidade}`,
        item.concluido ? 'Concluído' : 'Pendente',
        item.id_membro_doador ? membros.find(m => m.id === item.id_membro_doador)?.nome || '-' : '-'
      ]);

      const finHeaders = [['Data', 'Tipo', 'Descrição', 'Valor']];
      const finBody = eventoFin.map(fin => [
        format(new Date(fin.data), 'dd/MM/yyyy'),
        fin.tipo,
        fin.descricao,
        `R$ ${fin.valor.toFixed(2)}`
      ]);

      const fileName = `relatorio-evento-${evento.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      const shareText = `*Relatório do Evento: ${evento.nome}*\nData: ${format(new Date(evento.data), 'dd/MM/yyyy')}\nSaldo: R$ ${saldo.toFixed(2)}`;

      await gerarPDF({
        title: `Relatório do Evento: ${evento.nome}`,
        summaryFields,
        tables: [
          {
            title: 'Materiais Necessários',
            headers: itensHeaders,
            body: itensBody
          },
          {
            title: 'Lançamentos Financeiros',
            headers: finHeaders,
            body: finBody
          }
        ],
        action,
        fileName,
        shareTitle: `Relatório: ${evento.nome}`,
        shareText
      });
    } catch (error) {
      console.error("Erro ao gerar PDF do evento:", error);
      alert("Erro ao gerar o relatório.");
    }
  };

  // View: Detalhes do Evento
  if (selectedEventoId) {
    const evento = eventos.find(e => e.id === selectedEventoId);
    if (!evento) return <div>Evento não encontrado.</div>;

    const eventoFin = financeiro.filter(f => (f as any).id_evento === selectedEventoId);
    const arrecadado = eventoFin.filter(f => f.tipo === 'Entrada').reduce((acc, curr) => acc + curr.valor, 0);
    const gasto = eventoFin.filter(f => f.tipo === 'Saída').reduce((acc, curr) => acc + curr.valor, 0);
    const saldo = arrecadado - gasto;
    
    const progresso = evento.meta_financeira > 0 ? Math.min((arrecadado / evento.meta_financeira) * 100, 100) : 0;
    const isMetaBatida = progresso >= 100;

    const eventoItens = itens.filter(i => i.id_evento === selectedEventoId);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSelectedEventoId(null)} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-transparent dark:border-slate-700">
              <ArrowLeft className="text-slate-600 dark:text-slate-300" size={24} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{evento.nome}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{format(new Date(evento.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => gerarPDFEvento(evento, eventoItens, eventoFin, 'download')}
              className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 flex items-center"
              title="Baixar PDF"
            >
              <Download size={20} className="sm:mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button 
              onClick={() => gerarPDFEvento(evento, eventoItens, eventoFin, 'share')}
              className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-colors border border-emerald-100 dark:border-emerald-800 flex items-center"
              title="Compartilhar"
            >
              <Share2 size={20} className="sm:mr-2" />
              <span className="hidden sm:inline">Compartilhar</span>
            </button>
          </div>
        </div>

        {/* Progresso da Meta */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center">
                <Trophy className={`mr-2 ${isMetaBatida ? 'text-emerald-500 dark:text-emerald-400' : 'text-[#D97706] dark:text-[#FBBF24]'}`} size={18} />
                Meta Financeira
              </p>
              {isEditingMeta ? (
                <div className="flex items-center mt-1">
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 mr-2">R$ {arrecadado.toFixed(2)} / R$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={newMeta} 
                    onChange={e => setNewMeta(parseFloat(e.target.value))}
                    className="w-32 border border-slate-300 dark:border-slate-600 rounded-lg p-1 text-lg font-bold focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
                    autoFocus
                  />
                  <button onClick={() => handleUpdateMeta(evento.id)} className="ml-2 px-3 py-1 bg-emerald-500 dark:bg-emerald-600 text-white rounded-lg text-sm font-bold">Salvar</button>
                  <button onClick={() => setIsEditingMeta(false)} className="ml-2 px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold">Cancelar</button>
                </div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 cursor-pointer hover:text-[#D97706] dark:hover:text-[#FBBF24] transition-colors" onClick={() => { setIsEditingMeta(true); setNewMeta(evento.meta_financeira); }} title="Clique para editar a meta">
                  R$ {arrecadado.toFixed(2)} <span className="text-sm font-normal text-slate-400 dark:text-slate-500">/ R$ {evento.meta_financeira.toFixed(2)}</span>
                </h3>
              )}
            </div>
            <div className={`text-sm font-bold px-3 py-1 rounded-full ${isMetaBatida ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-[#FFF9E6] dark:bg-amber-900/30 text-[#D97706] dark:text-[#FBBF24]'}`}>
              {progresso.toFixed(1)}% alcançado
            </div>
          </div>
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${isMetaBatida ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] dark:from-[#D97706] dark:to-[#B45309]'}`}
              style={{ width: `${progresso}%` }}
            ></div>
          </div>
          {!isMetaBatida && evento.meta_financeira > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-right">Faltam apenas R$ {(evento.meta_financeira - arrecadado).toFixed(2)} para batermos a meta!</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna A: Necessidades / Materiais */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-[500px] transition-colors">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 transition-colors">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Materiais Necessários</h3>
              <button onClick={() => setIsNewItemModalOpen(true)} className="p-2 bg-white dark:bg-slate-800 text-[#D97706] dark:text-[#FBBF24] rounded-lg shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600">
                <Plus size={20} />
              </button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {eventoItens.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">Nenhum material cadastrado.</div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {eventoItens.map(item => (
                    <li key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <button onClick={() => toggleItemStatus(item)} className="text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                          {item.concluido ? <CheckCircle2 className="text-emerald-500 dark:text-emerald-400" size={24} /> : <Circle size={24} />}
                        </button>
                        <div>
                          <p className={`font-medium ${item.concluido ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.quantidade} {item.unidade} de {item.nome}
                          </p>
                          {item.id_membro_doador && (
                            <p className="text-xs text-[#D97706] dark:text-[#FBBF24]">Doador: {membros.find(m => m.id === item.id_membro_doador)?.nome}</p>
                          )}
                        </div>
                      </div>
                      <button onClick={() => deleteItem(item.id)} className="text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-2 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Coluna B: Financeiro do Evento */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-[500px] transition-colors">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 transition-colors">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Caixa do Evento</h3>
                <p className={`text-sm font-bold ${saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>Saldo: R$ {saldo.toFixed(2)}</p>
              </div>
              <button onClick={() => setIsNewFinModalOpen(true)} className="p-2 bg-white dark:bg-slate-800 text-[#D97706] dark:text-[#FBBF24] rounded-lg shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600">
                <DollarSign size={20} />
              </button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {eventoFin.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">Nenhum lançamento financeiro.</div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {eventoFin.map(fin => (
                    <li key={fin.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${fin.tipo === 'Entrada' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                          {fin.tipo === 'Entrada' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{fin.descricao}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(fin.data), 'dd/MM/yyyy')}</p>
                        </div>
                      </div>
                      <div className={`text-sm font-bold ${fin.tipo === 'Entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {fin.tipo === 'Entrada' ? '+' : '-'} R$ {fin.valor.toFixed(2)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Modal Novo Item */}
        {isNewItemModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-md shadow-xl flex flex-col transition-colors">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Novo Material Necessário</h3>
              </div>
              <div className="p-4">
                <form id="item-form" onSubmit={handleCreateItem} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Item *</label>
                    <input type="text" required value={itemForm.nome} onChange={e => setItemForm({...itemForm, nome: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2 focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors" placeholder="Ex: Arroz, Refrigerante..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantidade *</label>
                      <input type="number" required min="0.1" step="0.1" value={itemForm.quantidade} onChange={e => setItemForm({...itemForm, quantidade: parseFloat(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2 focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors" />
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidade *</label>
                      <div className="relative">
                        <select required value={itemForm.unidade} onChange={e => setItemForm({...itemForm, unidade: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2 pr-10 focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 appearance-none truncate transition-colors">
                          <option value="un">Unidade(s)</option>
                          <option value="kg">Kg</option>
                          <option value="L">Litro(s)</option>
                          <option value="pacote">Pacote(s)</option>
                          <option value="caixa">Caixa(s)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Doador (Opcional)</label>
                    <div className="relative">
                      <select value={itemForm.id_membro_doador} onChange={e => setItemForm({...itemForm, id_membro_doador: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2 pr-10 focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 appearance-none truncate transition-colors">
                        <option value="">Ainda não tem doador</option>
                        {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={16} />
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[2rem] transition-colors">
                <button type="button" onClick={() => setIsNewItemModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors">Cancelar</button>
                <button type="submit" form="item-form" className="px-4 py-2 bg-[#D97706] text-white rounded-xl font-semibold hover:bg-[#B45309] transition-colors">Adicionar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Novo Financeiro Evento */}
        {isNewFinModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-md shadow-xl flex flex-col transition-colors">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Lançamento do Evento</h3>
              </div>
              <div className="p-4">
                <form id="fin-form" onSubmit={handleCreateFin} className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo *</label>
                    <div className="relative">
                      <select required value={finForm.tipo} onChange={e => setFinForm({...finForm, tipo: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2 pr-10 focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 appearance-none truncate transition-colors">
                        <option value="Entrada">Entrada (Arrecadação/Venda)</option>
                        <option value="Saída">Saída (Custo/Compra)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição *</label>
                    <input type="text" required value={finForm.descricao} onChange={e => setFinForm({...finForm, descricao: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2 focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors" placeholder="Ex: Venda de convite, Compra de gelo..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$) *</label>
                    <input type="number" required step="0.01" value={finForm.valor || ''} onChange={e => setFinForm({...finForm, valor: parseFloat(e.target.value) || 0})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2 focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors" />
                  </div>
                  {finForm.tipo === 'Entrada' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Doador (Membro ou Visitante) *</label>
                      <input 
                        type="text" 
                        required
                        value={finForm.doador_nome || ''} 
                        onChange={e => setFinForm({...finForm, doador_nome: e.target.value})} 
                        className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2 focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors" 
                        placeholder="Selecione um membro ou digite o nome" 
                        list="membros-list"
                      />
                      <datalist id="membros-list">
                        {membros.map(m => <option key={m.id} value={m.nome} />)}
                      </datalist>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data *</label>
                    <input type="date" required value={finForm.data || ''} onChange={e => setFinForm({...finForm, data: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2 focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors" />
                  </div>
                </form>
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[2rem] transition-colors">
                <button type="button" onClick={() => setIsNewFinModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors disabled:opacity-50">Cancelar</button>
                <button type="submit" form="fin-form" disabled={isSubmitting} className="px-4 py-2 bg-[#D97706] text-white rounded-xl font-semibold hover:bg-[#B45309] transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View: Lista de Eventos
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Eventos
          {loading && <span className="ml-3 text-sm font-normal text-slate-400 dark:text-slate-500 animate-pulse">Atualizando...</span>}
        </h2>
        <button 
          onClick={() => setIsNewEventoModalOpen(true)}
          className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] dark:from-[#D97706] dark:to-[#B45309] hover:from-[#D97706] hover:to-[#B45309] text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md flex items-center w-full sm:w-auto justify-center"
        >
          <Plus size={20} className="mr-2" /> Novo Evento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventos.map(evento => {
          const eventoFin = financeiro.filter(f => (f as any).id_evento === evento.id);
          const arrecadado = eventoFin.filter(f => f.tipo === 'Entrada').reduce((acc, curr) => acc + curr.valor, 0);
          const progresso = evento.meta_financeira > 0 ? Math.min((arrecadado / evento.meta_financeira) * 100, 100) : 0;
          const isMetaBatida = progresso >= 100;

          return (
            <div 
              key={evento.id} 
              onClick={() => setSelectedEventoId(evento.id)}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 cursor-pointer hover:shadow-md transition-all hover:border-[#FDE68A] dark:hover:border-[#D97706] group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-[#FFF9E6] dark:bg-amber-900/30 p-3 rounded-xl text-[#D97706] dark:text-[#FBBF24] group-hover:scale-110 transition-transform">
                  <Calendar size={24} />
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${evento.status === 'Aberto' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  {evento.status}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">{evento.nome}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{format(new Date(evento.data), "dd/MM/yyyy")}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Arrecadado</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">R$ {arrecadado.toFixed(2)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${isMetaBatida ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-[#D97706] dark:bg-[#D97706]'}`}
                    style={{ width: `${progresso}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Meta: R$ {evento.meta_financeira.toFixed(2)}
                </div>
              </div>

              {eventoFin.length > 0 && (
                <div className="mt-4 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Últimos Lançamentos</p>
                  {eventoFin.slice(0, 2).map(f => (
                    <div key={f.id} className="flex justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-400 truncate mr-2">{f.descricao}</span>
                      <span className={`font-bold ${f.tipo === 'Entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {f.tipo === 'Entrada' ? '+' : '-'} R${f.valor.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700 flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEventoId(evento.id);
                    setIsNewFinModalOpen(true);
                  }}
                  className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center"
                >
                  <DollarSign size={14} className="mr-1" /> Lançar Valor
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEventoId(evento.id);
                  }}
                  className="flex-1 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          );
        })}
        {eventos.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-dashed transition-colors">
            Nenhum evento cadastrado. Crie o primeiro!
          </div>
        )}
      </div>

      {/* Modal Novo Evento */}
      {isNewEventoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-md shadow-xl flex flex-col transition-colors">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Novo Evento</h3>
            </div>
            <div className="p-4">
              <form id="evento-form" onSubmit={handleCreateEvento} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Evento *</label>
                  <input type="text" required value={eventoForm.nome} onChange={e => setEventoForm({...eventoForm, nome: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2 focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors" placeholder="Ex: Feijoada de Ogum" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data do Evento *</label>
                  <input type="date" required value={eventoForm.data} onChange={e => setEventoForm({...eventoForm, data: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2 focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meta de Arrecadação (R$) *</label>
                  <input type="number" required step="0.01" value={eventoForm.meta_financeira} onChange={e => setEventoForm({...eventoForm, meta_financeira: parseFloat(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 rounded-xl p-2 focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors" />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-[2rem] transition-colors">
              <button type="button" onClick={() => setIsNewEventoModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors disabled:opacity-50">Cancelar</button>
              <button type="submit" form="evento-form" disabled={isSubmitting} className="px-4 py-2 bg-[#D97706] text-white rounded-xl font-semibold hover:bg-[#B45309] transition-colors disabled:opacity-50">
                {isSubmitting ? 'Criando...' : 'Criar Evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
