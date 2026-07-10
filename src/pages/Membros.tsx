import React, { useState, useMemo } from 'react';
import { addDoc } from '../lib/firestore';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { validarMembro, formatarErros } from '../utils/validators';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { Membro } from '../types';
import { Plus, Search, Edit2, UserCheck, UserX, Briefcase, Trash2, ChevronDown } from 'lucide-react';

import membrosAxéFull from '../membros.json';

export default function Membros() {
  const { membros, financeiro, loading } = useData();
  const { userRole } = useAuth();
  const { isAdmin } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchProfissao, setSearchProfissao] = useState('');

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const isDelinquent = (membroId: string) => {
    return !financeiro.some(f => 
      f.id_membro === membroId && 
      f.tipo === 'Entrada' &&
      new Date(f.data).getMonth() === currentMonth &&
      new Date(f.data).getFullYear() === currentYear
    );
  };
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string, nome: string } | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<{ importados: number, duplicados: number } | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Membro>>({
    nome: '',
    nascimento: '',
    whatsapp: '',
    email: '',
    profissao: '',
    escolaridade: '',
    endereco_rua: '',
    endereco_numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    rg: '',
    cpf: '',
    contribuicao_sugerida: 0,
    status: 'Ativo',
    isDependent: false,
    parentEmail: ''
  });

  const filteredMembros = useMemo(() => {
    // Agrupar dependentes abaixo dos pais
    const sorted = [...membros].sort((a, b) => {
      if (a.parentEmail === b.email) return 1;
      if (b.parentEmail === a.email) return -1;
      return (a.nome || '').localeCompare(b.nome || '');
    });

    const removeAccents = (str: string) => {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    return sorted.filter(m => {
      const nomeNormalizado = removeAccents((m.nome || '').toLowerCase());
      const buscaNomeNormalizada = removeAccents(searchTerm.toLowerCase());
      const matchNome = nomeNormalizado.includes(buscaNomeNormalizada);

      const profissaoNormalizada = removeAccents((m.profissao || '').toLowerCase());
      const buscaProfissaoNormalizada = removeAccents(searchProfissao.toLowerCase());
      const matchProfissao = searchProfissao ? profissaoNormalizada.includes(buscaProfissaoNormalizada) : true;
      
      return matchNome && matchProfissao;
    });
  }, [membros, searchTerm, searchProfissao]);

  const openEditModal = (membro: Membro) => {
    setEditingId(membro.id);
    setFormData({
      nome: membro.nome,
      nascimento: membro.nascimento,
      whatsapp: membro.whatsapp,
      email: membro.email,
      profissao: membro.profissao,
      escolaridade: membro.escolaridade,
      endereco_rua: membro.endereco_rua,
      endereco_numero: membro.endereco_numero,
      bairro: membro.bairro,
      cidade: membro.cidade,
      estado: membro.estado,
      rg: membro.rg,
      cpf: membro.cpf,
      contribuicao_sugerida: membro.contribuicao_sugerida,
      status: membro.status,
      isDependent: membro.isDependent,
      parentEmail: membro.parentEmail
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação utilizando o novo validator
    const validacao = validarMembro({
      nome: formData.nome || '',
      email: formData.email || '',
      whatsapp: formData.whatsapp || ''
    });

    if (!validacao.valido) {
      alert(`Erros de validação:\n${formatarErros(validacao.erros)}`);
      return;
    }

    // Validação de data de nascimento
    if (formData.nascimento) {
      const birthDate = new Date(formData.nascimento);
      const today = new Date();
      if (birthDate > today) {
        alert('A data de nascimento não pode ser no futuro.');
        return;
      }
    }

    try {
      const { data_cadastro, ...restFormData } = formData;
      const membroData = {
        ...restFormData,
        contribuicao_sugerida: Number(formData.contribuicao_sugerida) || 0,
        isDependent: !!formData.isDependent,
        parentEmail: formData.isDependent ? formData.parentEmail || '' : '',
        id_casa: userRole?.id_casa || null,
        ambiente: userRole?.ambiente || 'producao',
        criado_por_email: auth.currentUser?.email
      };

      if (editingId) {
        await updateDoc(doc(db, 'membros', editingId), membroData);
      } else {
        await addDoc('membros', {
          ...membroData,
          data_cadastro: new Date().toISOString()
        });
      }

      await addDoc('audit_logs', {
        data: new Date().toISOString(),
        usuario_email: auth.currentUser?.email || 'Desconhecido',
        acao: editingId ? 'EDITAR_MEMBRO' : 'CRIAR_MEMBRO',
        resumo: `${editingId ? 'Edição' : 'Criação'} do membro: ${formData.nome}`
      });

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ nome: '', nascimento: '', whatsapp: '', email: '', profissao: '', contribuicao_sugerida: 0, status: 'Ativo', isDependent: false, parentEmail: '' });
    } catch (error) {
      console.error("Erro ao salvar membro:", error);
      alert('Erro ao salvar. Verifique suas permissões.');
    }
  };

  const confirmDeleteMembro = (id: string, nome: string) => {
    setMemberToDelete({ id, nome });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteMembro = async () => {
    if (!memberToDelete) return;
    try {
      await deleteDoc(doc(db, 'membros', memberToDelete.id));
      await addDoc('audit_logs', {
        data: new Date().toISOString(),
        usuario_email: auth.currentUser?.email || 'Desconhecido',
        acao: 'EXCLUIR_MEMBRO',
        resumo: `Exclusão do membro: ${memberToDelete.nome}`
      });
    } catch (error) {
      console.error("Erro ao excluir membro:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
    }
  };

  const confirmImportMembers = () => {
    setIsImportModalOpen(true);
  };

  const importMembers = async () => {
    let importados = 0;
    let duplicados = 0;

    for (const membro of membrosAxéFull) {
      // Verifica duplicidade por CPF ou Nome
      const isDuplicate = membros.some(m => 
        (membro.cpf && m.cpf === membro.cpf) || 
        (m.nome.toLowerCase() === membro.nome.toLowerCase())
      );

      if (isDuplicate) {
        duplicados++;
        continue; // Pula este membro pois já existe
      }

      await addDoc('membros', {
        ...membro,
        data_cadastro: new Date().toISOString(),
        contribuicao_sugerida: Number(membro.contribuicao) || 0,
        nascimento: membro.nascimento,
        whatsapp: membro.whatsapp,
        email: membro.email,
        profissao: membro.profissao,
        escolaridade: membro.escolaridade,
        endereco_rua: membro.endereco,
        endereco_numero: membro.numero,
        bairro: membro.bairro,
        cidade: membro.cidade,
        estado: membro.estado,
        rg: membro.rg,
        cpf: membro.cpf,
        status: membro.status,
        isDependent: !!membro.isDependent,
        parentEmail: (membro as any).emailResponsavel || '',
        id_casa: userRole?.id_casa,
        ambiente: 'producao'
      });
      importados++;
    }
    setImportResult({ importados, duplicados });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Membros
            {loading && <span className="ml-3 text-sm font-normal text-slate-400 dark:text-slate-500 animate-pulse">Atualizando...</span>}
          </h2>
          <div className="mt-2">
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm inline-flex flex-col transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total de Membros</span>
              <span className="text-xl font-black text-slate-700 dark:text-slate-200 leading-none mt-1">{membros.length}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {(userRole?.role === 'MASTER' || userRole?.role === 'ADMIN_CASA') && (
            <button 
              onClick={confirmImportMembers}
              className="bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md flex items-center flex-1 sm:flex-none justify-center"
            >
              Importar Dados
            </button>
          )}
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ nome: '', nascimento: '', whatsapp: '', email: '', profissao: '', contribuicao_sugerida: 0, status: 'Ativo', isDependent: false, parentEmail: '' });
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] dark:from-[#D97706] dark:to-[#B45309] hover:from-[#D97706] hover:to-[#B45309] text-white px-5 py-2.5 rounded-xl flex items-center font-semibold shadow-md transition-all flex-1 sm:flex-none justify-center"
          >
            <Plus size={20} className="mr-2" /> Novo Membro
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
          />
        </div>
        <div className="relative flex-1 md:max-w-xs">
          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Filtrar por profissão..." 
            value={searchProfissao}
            onChange={(e) => setSearchProfissao(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
          />
        </div>
      </div>

      {/* Lista de Membros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredMembros.map(membro => {
          const delinquent = isDelinquent(membro.id);
          return (
            <div key={membro.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full ${membro.status === 'Ativo' ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-red-500 dark:bg-red-600'}`}></div>
              <div className="flex justify-between items-start mb-2 pl-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base truncate">
                    {membro.nome}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 mb-1">
                    {membro.isDependent && (
                      <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 px-2 py-0.5 rounded-md">
                        Dependente
                      </span>
                    )}
                    {delinquent && membro.status === 'Ativo' && (
                      <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md border border-red-100 dark:border-red-800" title="Pendente este mês">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Débito</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{membro.profissao || 'Profissão não informada'}</p>
                </div>
                <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(membro)} className="text-slate-400 dark:text-slate-500 hover:text-[#D97706] dark:hover:text-[#FBBF24] transition-colors p-1 flex-shrink-0" title="Editar">
                    <Edit2 size={16} />
                  </button>
                  {isAdmin && (
                    <button onClick={() => confirmDeleteMembro(membro.id, membro.nome)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 flex-shrink-0" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pl-2">
                <p className="truncate"><span className="font-medium text-slate-700 dark:text-slate-400">WhatsApp:</span> {membro.whatsapp || '-'}</p>
                <p className="truncate"><span className="font-medium text-slate-700 dark:text-slate-400">Email:</span> {membro.email || '-'}</p>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50 dark:border-slate-700/50">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">R$ {(Number(membro.contribuicao_sugerida) || 0).toFixed(2)}/mês</span>
                  <span className={`flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${membro.status === 'Ativo' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                    {membro.status === 'Ativo' ? <UserCheck size={12} className="mr-1"/> : <UserX size={12} className="mr-1"/>}
                    {membro.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredMembros.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-100 border-dashed">
            Nenhum membro encontrado com os filtros atuais.
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex-shrink-0">
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? 'Editar Membro' : 'Novo Membro'}
              </h3>
            </div>
            
            <div className="p-3 sm:p-4 overflow-y-auto flex-1">
              <form id="membro-form" onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-0.5">Nome Completo *</label>
                    <input type="text" required value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] outline-none" />
                  </div>
                  
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-0.5">Endereço (Rua/Avenida)</label>
                      <input type="text" value={formData.endereco_rua || ''} onChange={e => setFormData({...formData, endereco_rua: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] outline-none" placeholder="Ex: Rua das Flores" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-0.5">Número</label>
                      <input type="text" value={formData.endereco_numero || ''} onChange={e => setFormData({...formData, endereco_numero: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] outline-none" placeholder="Ex: 123" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-0.5">Bairro</label>
                      <input type="text" value={formData.bairro || ''} onChange={e => setFormData({...formData, bairro: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-0.5">Cidade</label>
                      <input type="text" value={formData.cidade || ''} onChange={e => setFormData({...formData, cidade: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] outline-none" />
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-medium text-slate-700 mb-0.5">Estado</label>
                      <div className="relative">
                        <select value={formData.estado || ''} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 pr-10 text-sm focus:ring-2 focus:ring-[#D97706] outline-none bg-white appearance-none truncate">
                          <option value="">Selecione...</option>
                          <option value="SP">SP</option>
                          <option value="SC">SC</option>
                          {/* Add other states if needed */}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-0.5">RG</label>
                    <input type="text" value={formData.rg || ''} onChange={e => setFormData({...formData, rg: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] outline-none" placeholder="00.000.000-0" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-0.5">CPF</label>
                    <input type="text" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] outline-none" placeholder="000.000.000-00" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-0.5">Data de Nascimento</label>
                    <input type="date" value={formData.nascimento || ''} onChange={e => setFormData({...formData, nascimento: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-0.5">WhatsApp (Celular)</label>
                    <input type="tel" value={formData.whatsapp || ''} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-0.5">E-mail</label>
                    <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] outline-none" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-0.5">Profissão</label>
                    <input type="text" value={formData.profissao || ''} onChange={e => setFormData({...formData, profissao: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] outline-none" placeholder="Ex: Advogado, Pedreiro..." />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 mb-0.5">Escolaridade</label>
                    <div className="relative">
                      <select value={formData.escolaridade || ''} onChange={e => setFormData({...formData, escolaridade: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2.5 pr-10 text-sm focus:ring-2 focus:ring-[#D97706] outline-none bg-white appearance-none truncate">
                        <option value="">Selecione...</option>
                        <option value="Ensino Fundamental Incompleto">Ensino Fundamental Incompleto</option>
                        <option value="Ensino Fundamental Completo">Ensino Fundamental Completo</option>
                        <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
                        <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                        <option value="Ensino Superior Incompleto">Ensino Superior Incompleto</option>
                        <option value="Ensino Superior Completo">Ensino Superior Completo</option>
                        <option value="Pós-graduação">Pós-graduação</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-0.5">Contribuição Sugerida (R$)</label>
                    <input type="number" step="0.01" value={formData.contribuicao_sugerida ?? ''} onChange={e => setFormData({...formData, contribuicao_sugerida: parseFloat(e.target.value) || 0})} className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] outline-none" />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-medium text-slate-700 mb-0.5">Status</label>
                    <div className="relative">
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'Ativo' | 'Inativo'})} className="w-full border border-slate-300 rounded-xl p-2.5 pr-10 text-sm focus:ring-2 focus:ring-[#D97706] outline-none bg-white appearance-none truncate">
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center text-xs font-medium text-slate-700 mb-0.5 mt-4">
                      <input type="checkbox" checked={formData.isDependent} onChange={e => setFormData({...formData, isDependent: e.target.checked})} className="mr-2" />
                      É Dependente?
                    </label>
                  </div>
                  {formData.isDependent && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-0.5">E-mail do Responsável</label>
                      <input type="email" value={formData.parentEmail || ''} onChange={e => setFormData({...formData, parentEmail: e.target.value})} className="w-full border border-slate-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-[#D97706] outline-none" />
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 flex-shrink-0 flex justify-end space-x-3 bg-slate-50 rounded-b-[2rem]">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors">
                Cancelar
              </button>
              <button type="submit" form="membro-form" className="px-5 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                {editingId ? 'Salvar Alterações' : 'Cadastrar Membro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && memberToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Excluir Membro</h3>
              <p className="text-slate-600">
                Deseja realmente excluir o membro <span className="font-semibold">{memberToDelete.nome}</span>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setMemberToDelete(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteMembro}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Importar Membros</h3>
              {!importResult ? (
                <p className="text-slate-600">
                  Tem certeza que deseja importar os membros do arquivo? Membros com o mesmo CPF ou Nome serão ignorados para evitar duplicidade.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 text-green-800 rounded-xl border border-green-100">
                    <p className="font-semibold">Importação concluída!</p>
                    <ul className="mt-2 text-sm space-y-1">
                      <li>• {importResult.importados} novos membros adicionados.</li>
                      <li>• {importResult.duplicados} ignorados por já existirem.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              {!importResult ? (
                <>
                  <button 
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={importMembers}
                    className="px-4 py-2 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors shadow-sm"
                  >
                    Confirmar Importação
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportResult(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors shadow-sm"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
