import { useState, useEffect, useMemo, FormEvent } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, addDoc, setDoc, Timestamp, where, getDocs } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../firebase';
import { AuditLog } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Shield, 
  Activity, 
  User, 
  Users, 
  X, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Home, 
  CheckCircle, 
  Database,
  ShieldAlert,
  Sliders,
  Settings,
  Mail,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/roles';
import { gerarDadosDemo } from '../scripts/gerar-dados-demo';

interface UserProfile {
  uid: string;
  nome: string;
  email: string;
  foto?: string;
  ultimo_login?: any;
  bloqueado?: boolean;
  role?: Role;
  id_casa?: string;
  ambiente?: 'producao' | 'teste';
}

interface CasaAxe {
  id: string;
  nome: string;
  admin_email: string;
  created_at?: any;
}

export default function Admin() {
  const { user: currentAuthUser, userRole, temPermissao } = useAuth();
  const currentUser = auth.currentUser;

  // Estados Base
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [clearingSecurityLogs, setClearingSecurityLogs] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [casas, setCasas] = useState<CasaAxe[]>([]);
  const [testers, setTesters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Navegação Interna
  const [activeTab, setActiveTab] = useState<'dashboard' | 'access' | 'casas' | 'testes' | 'seguranca'>('dashboard');

  // Modais e Estados de Criação
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showNovaCasaModal, setShowNovaCasaModal] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | '5days'>('5days');

  // Formulário Nova Casa
  const [novaCasaNome, setNovaCasaNome] = useState('');
  const [novaCasaAdminEmail, setNovaCasaAdminEmail] = useState('');
  const [savingCasa, setSavingCasa] = useState(false);

  // Formulário Novo Testador
  const [novoTesterEmail, setNovoTesterEmail] = useState('');
  const [savingTester, setSavingTester] = useState(false);

  // Geração de Dados Demo
  const [gerandoDemo, setGerandoDemo] = useState(false);
  const [progressoDemo, setProgressoDemo] = useState('');

  // Segurança de Acesso Master
  const isMaster = useMemo(() => {
    return userRole?.role === Role.MASTER || currentAuthUser?.email?.toLowerCase() === 'gustavomacedo.consultor@gmail.com';
  }, [userRole, currentAuthUser]);

  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return logs;
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    return logs.filter(log => new Date(log.data) >= fiveDaysAgo);
  }, [logs, logFilter]);

  // Listener principal do Firestore administrado
  useEffect(() => {
    let unsubLogs = () => {};
    let unsubSecLogs = () => {};

    if (isMaster) {
      // 1. Logs de Auditoria
      unsubLogs = onSnapshot(
        query(collection(db, 'audit_logs'), orderBy('data', 'desc')), 
        (snapshot) => {
          setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)));
        },
        (err) => console.error('Erro nos logs:', err)
      );

      // 1.5 Logs de Segurança (isMaster-only)
      unsubSecLogs = onSnapshot(
        query(collection(db, 'security_logs'), orderBy('data', 'desc')),
        (snapshot) => {
          setSecurityLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        },
        (err) => console.error('Erro nos logs de segurança:', err)
      );
    }

    // 2. Coleção de Usuários
    const usersQuery = isMaster 
      ? query(collection(db, 'users'))
      : query(collection(db, 'users'), where('id_casa', '==', userRole?.id_casa || ''));
      
    const unsubUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
        setLoading(false);
      },
      (err) => {
        console.error('Erro nos usuários:', err);
        setLoading(false);
      }
    );

    // 3. Casas de Axé (ACL)
    const casasQuery = isMaster
      ? query(collection(db, 'casas_axe'))
      : query(collection(db, 'casas_axe'), where('admin_email', '==', userRole?.email || ''));

    const unsubCasas = onSnapshot(
      casasQuery,
      (snapshot) => {
        setCasas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CasaAxe)));
      },
      (err) => console.error('Erro nas casas de axé:', err)
    );

    // 4. Configurações de Testadores (ACL)
    let unsubConfig = () => {};
    if (isMaster) {
      unsubConfig = onSnapshot(
        doc(db, 'config', 'acl'), 
        (snapshot) => {
          if (snapshot.exists()) {
            setTesters(snapshot.data().testers || []);
          } else {
            setTesters([]);
          }
        },
        (err) => console.error('Erro nos testadores:', err)
      );
    }

    return () => {
      unsubLogs();
      unsubSecLogs();
      unsubUsers();
      unsubCasas();
      unsubConfig();
    };
  }, [isMaster, userRole, currentAuthUser]);

  // Alteração segura do bloqueio de usuário
  const toggleUserBlock = async (uid: string, blocked: boolean, emailUser: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        bloqueado: blocked,
        role: blocked ? Role.BLOQUEADO : Role.EDITOR
      });

      await addDoc(collection(db, 'audit_logs'), {
        data: new Date().toISOString(),
        usuario_email: currentUser?.email || 'sistema@portal.com',
        acao: 'ALT_BLOQUEIO',
        resumo: `Alterou bloqueio do usuário ${emailUser} para: ${blocked ? 'BLOQUEADO' : 'LIBERADO'}`
      });
    } catch (error) {
      console.error('Erro ao bloquear/liberar usuário:', error);
      alert('Erro ao alterar status do usuário.');
    }
  };

  const handleResetarSenha = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Email de redefinição de senha enviado para: ${email}`);
      
      // Registrar auditoria
      await addDoc(collection(db, 'audit_logs'), {
        data: new Date().toISOString(),
        usuario_email: auth.currentUser?.email,
        acao: 'RESETAR_SENHA',
        resumo: `Reset de senha solicitado para: ${email}`
      });
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      alert('Erro ao enviar email de redefinição: ' + (error.message || 'Tente novamente.'));
    }
  };

  // Alteração rápida de Nível de Acesso (Role)
  const handleChangeRole = async (uid: string, targetEmail: string, oldRole: Role, newRole: Role) => {
    if (targetEmail.toLowerCase() === 'gustavomacedo.consultor@gmail.com' && newRole !== Role.MASTER) {
      alert('Você não pode remover o cargo MASTER do proprietário principal do sistema!');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
        bloqueado: newRole === Role.BLOQUEADO
      });

      await addDoc(collection(db, 'audit_logs'), {
        data: new Date().toISOString(),
        usuario_email: currentUser?.email || 'sistema@portal.com',
        acao: 'ALTEROU_NIVEL',
        resumo: `ALTEROU_NIVEL: email ${targetEmail} de ${oldRole} para ${newRole}`
      });
    } catch (error) {
      console.error('Erro ao atualizar cargo:', error);
      alert('Erro ao atualizar cargo do usuário.');
    }
  };

  // Alteração de Casa de Axé vinculada
  const handleChangeCasa = async (uid: string, targetEmail: string, newCasaId: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        id_casa: newCasaId
      });

      await addDoc(collection(db, 'audit_logs'), {
        data: new Date().toISOString(),
        usuario_email: currentUser?.email || 'sistema@portal.com',
        acao: 'ALTEROU_CASA',
        resumo: `Vinculou usuário ${targetEmail} à casa: ${newCasaId}`
      });
    } catch (error) {
      console.error('Erro ao alterar casa do usuário:', error);
      alert('Erro ao vincular casa.');
    }
  };

  // Alteração de Ambiente de execução
  const handleChangeAmbiente = async (uid: string, targetEmail: string, env: 'producao' | 'teste') => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ambiente: env
      });

      await addDoc(collection(db, 'audit_logs'), {
        data: new Date().toISOString(),
        usuario_email: currentUser?.email || 'sistema@portal.com',
        acao: 'ALTEROU_AMBIENTE',
        resumo: `Alterou ambiente do usuário ${targetEmail} para: ${env}`
      });
    } catch (error) {
      console.error('Erro ao alterar ambiente:', error);
      alert('Erro ao alterar ambiente do usuário.');
    }
  };

  // Criar Nova Casa de Axé
  const handleCreateCasa = async (e: FormEvent) => {
    e.preventDefault();
    if (!novaCasaNome.trim() || !novaCasaAdminEmail.trim()) {
      alert('Preencha os dados do nome e email do administrador!');
      return;
    }

    setSavingCasa(true);
    try {
      console.log('🏠 Criando casa:', novaCasaNome, novaCasaAdminEmail);
      
      const emailLimpo = novaCasaAdminEmail.trim().toLowerCase();
      // Em vez de ID gerado, deixe o Firestore criar ou use addDoc
      const casaRef = await addDoc(collection(db, 'casas_axe'), {
        nome: novaCasaNome,
        admin_email: emailLimpo,
        created_at: new Date().toISOString(),
        status: 'trial'
      });
      
      console.log('✅ Casa criada com ID:', casaRef.id);

      // Atualizar usuário admin com id_casa
      const usersSnap = await getDocs(collection(db, 'users'));
      const userDoc = usersSnap.docs.find(d => d.data().email === emailLimpo);
      
      if (userDoc) {
        await updateDoc(doc(db, 'users', userDoc.id), {
          id_casa: casaRef.id,
          role: 'ADMIN_CASA'
        });
        console.log('✅ Usuário vinculado à casa');
      }

      await addDoc(collection(db, 'audit_logs'), {
        data: new Date().toISOString(),
        usuario_email: currentUser?.email || 'sistema@portal.com',
        acao: 'CRIAR_CASA',
        resumo: `Criou nova Casa de Axé: "${novaCasaNome}" (ID: ${casaRef.id}, Admin: ${emailLimpo})`
      });

      alert('Casa de Axé criada com sucesso!');
      setNovaCasaNome('');
      setNovaCasaAdminEmail('');
      setShowNovaCasaModal(false);
    } catch (err: any) {
      console.error('❌ Erro ao criar casa:', err);
      alert('Erro ao criar Casa de Axé: ' + (err.message || 'Verifique as permissões.'));
    } finally {
      setSavingCasa(false);
    }
  };

  // Adicionar Testador
  const handleAddTester = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = novoTesterEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    if (testers.includes(cleanEmail)) {
      alert('Este e-mail já está cadastrado como testador!');
      return;
    }

    setSavingTester(true);
    try {
      const novasTestes = [...testers, cleanEmail];
      await setDoc(doc(db, 'config', 'acl'), {
        testers: novasTestes,
        updated_at: Timestamp.now(),
        updated_by: currentUser?.email || 'sistema'
      }, { merge: true });

      setNovoTesterEmail('');
    } catch (err) {
      console.error('Erro ao adicionar testador:', err);
      alert('Erro ao registrar testador.');
    } finally {
      setSavingTester(false);
    }
  };

  // Remover Testador
  const handleRemoveTester = async (emailToRemove: string) => {
    try {
      const novasTestes = testers.filter(e => e !== emailToRemove);
      await setDoc(doc(db, 'config', 'acl'), {
        testers: novasTestes,
        updated_at: Timestamp.now(),
        updated_by: currentUser?.email || 'sistema'
      }, { merge: true });
    } catch (err) {
      console.error('Erro ao remover testador:', err);
      alert('Erro ao remover testador.');
    }
  };

  // Tratar geração automática de Dados Demo
  const triggerGerarDadosDemo = async () => {
    const confirmation = window.confirm(
      'Isso gerará 5 membros, 10 transações financeiras e 2 eventos no ambiente de demonstração (ambiente: teste, Casa Principal). Deseja prosseguir?'
    );
    if (!confirmation) return;

    setGerandoDemo(true);
    setProgressoDemo('Preparando sandbox e gerando entidades...');
    try {
      const out = await gerarDadosDemo('casa_principal');
      
      await addDoc(collection(db, 'audit_logs'), {
        data: new Date().toISOString(),
        usuario_email: currentUser?.email || 'sistema',
        acao: 'GERAR_DADOS_DEMO',
        resumo: `Gerou conjunto completo de dados demo: ${out.membros} membros, ${out.transacoes} transações, ${out.eventos} eventos`
      });

      alert(`Sucesso! Foram populados no Ambiente de Testes:\n- ${out.membros} Membros\n- ${out.transacoes} Lançamentos Financeiros\n- ${out.eventos} Eventos`);
    } catch (err) {
      console.error('Erro geral ao instanciar dados fictícios:', err);
      alert('Erro na geração de dados demo.');
    } finally {
      setGerandoDemo(false);
      setProgressoDemo('');
    }
  };

  // Função utilitária para formatar timestamp
  const formatarTimestamp = (val: any) => {
    if (!val) return 'N/A';
    try {
      if (typeof val.toDate === 'function') {
        return format(val.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR });
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
      }
    } catch (e) {
      // ignore helper error
    }
    return 'N/A';
  };

  // Limpar Logs de Segurança (Confirmação Dupla)
  const handleClearSecurityLogs = async () => {
    const confirmacao1 = window.confirm('Deseja realmente limpar TODOS os logs de segurança registrados?');
    if (!confirmacao1) return;
    
    const confirmacao2 = window.confirm('ATENÇÃO: Esta ação é irreversível e excluirá todo o histórico de tentativas de invasão ou acessos não autorizados. Deseja prosseguir de forma definitiva?');
    if (!confirmacao2) return;

    setClearingSecurityLogs(true);
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const deletePromises = securityLogs.map(log => deleteDoc(doc(db, 'security_logs', log.id)));
      await Promise.all(deletePromises);

      await addDoc(collection(db, 'audit_logs'), {
        data: new Date().toISOString(),
        usuario_email: currentUser?.email || 'sistema@portal.com',
        acao: 'LIMPAR_SEGURANCA_LOGS',
        resumo: `Limpou permanentemente os logs de tentativas de intrusão/segurança.`
      });

      alert('Logs de segurança limpos com sucesso.');
    } catch (err) {
      console.error('Erro ao apagar logs de segurança:', err);
      alert('Não foi possível limpar os logs de segurança.');
    } finally {
      setClearingSecurityLogs(false);
    }
  };

  // Tela de acesso restrito (redundância corporativa no nível UI)
  if (!isMaster) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500 max-w-md mx-auto text-center gap-4">
        <div className="p-4 bg-amber-50 rounded-full text-amber-500">
          <ShieldAlert size={64} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Seção Restrita ao Master</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Você está logado como <span className="font-semibold text-slate-800">{currentUser?.email}</span>. Este painel requer nível de privilégio superior (MASTER) para alterações nas diretrizes do Portal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center tracking-tight">
            <Shield className="mr-3 text-[#D97706]" size={28} />
            Painel de Administração
            {loading && <span className="ml-3 text-sm font-normal text-slate-400 animate-pulse">Carregando...</span>}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de acessos, diretórios, controle federado de casas de axé e barramento analítico de testes.
          </p>
        </div>
      </div>

      {/* Navegação por Abas Elegant (Design System) */}
      <div className="flex bg-slate-100/80 p-1 rounded-2xl max-w-3xl border border-slate-200/50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'dashboard' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Activity size={16} />
          Resumo & Logs
        </button>
        <button
          onClick={() => setActiveTab('access')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'access' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Sliders size={16} />
          Gerenciar Acessos
        </button>
        <button
          onClick={() => setActiveTab('casas')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'casas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Home size={16} />
          Casas de Axé
        </button>
        <button
          onClick={() => setActiveTab('testes')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'testes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Database size={16} />
          Demo / Testadores
        </button>
        <button
          onClick={() => setActiveTab('seguranca')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'seguranca' ? 'bg-white text-slate-800 shadow-sm font-extrabold ring-1 ring-red-100' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Shield size={16} className="text-red-500" />
          Segurança
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 h-full">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FFF9E6] rounded-full flex-shrink-0 flex items-center justify-center text-[#D97706]">
                <User size={28} className="sm:w-8 sm:h-8" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide">Administrador Logado</p>
                <h3 className="text-sm sm:text-lg font-bold text-slate-800 truncate">{currentUser?.displayName || 'Sacerdote Master'}</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">{currentUser?.email}</p>
              </div>
            </div>

            <div 
              onClick={() => setShowLogsModal(true)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 h-full cursor-pointer hover:bg-slate-50/50 transition-all group"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 rounded-full flex-shrink-0 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                <Activity size={28} className="sm:w-8 sm:h-8" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide">Logs de Auditoria</p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{logs.length}</h3>
                <p className="text-[9px] sm:text-xs text-slate-400 truncate">Clique para abrir controle de eventos</p>
              </div>
            </div>

            <div 
              onClick={() => setShowUsersModal(true)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 h-full cursor-pointer hover:bg-slate-50/50 transition-all group"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 rounded-full flex-shrink-0 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <Users size={28} className="sm:w-8 sm:h-8" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide">Diretoria Unificada</p>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{users.length}</h3>
                <p className="text-[9px] sm:text-xs text-slate-400 truncate">Contas ativas e operacionais</p>
              </div>
            </div>
          </div>

          {/* Tabela de Usuários Resumida */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Diretoria de Operações</h3>
              <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-bold">{users.length} usuários</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Membro</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nível de Cargo</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Último Acesso</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acesso</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-slate-50/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9">
                            {u.foto ? (
                              <img className="h-9 w-9 rounded-full border border-slate-100" src={u.foto} alt="" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-100">
                                {u.nome ? u.nome.substring(0, 1).toUpperCase() : 'U'}
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-xs font-bold text-slate-800">{u.nome || 'Sacerdote / Diretor'}</div>
                            <div className="text-[10px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 inline-flex text-[10px] leading-4 font-bold rounded-full ${u.bloqueado ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                          {u.role || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] text-slate-500 font-medium">
                        {formatarTimestamp(u.ultimo_login)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        {u.bloqueado ? (
                          <button 
                            onClick={() => toggleUserBlock(u.uid, false, u.email)}
                            className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1.5 ml-auto border border-emerald-200/50 bg-emerald-50/50 px-2.5 py-1 rounded-lg"
                          >
                            <Unlock size={14} />
                            Desbloquear
                          </button>
                        ) : (
                          <button 
                            onClick={() => toggleUserBlock(u.uid, true, u.email)}
                            className="text-red-500 hover:text-red-600 font-bold flex items-center gap-1.5 ml-auto border border-red-200/50 bg-red-50/50 px-2.5 py-1 rounded-lg"
                          >
                            <Lock size={14} />
                            Bloquear
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'access' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Matriz de Controle de Acesso (ACL)</h3>
            <p className="text-xs text-slate-500 mt-1">Configure o nível de cargo, vinculação de terreiro ou casa operacional e ambiente de testes para cada usuário credenciado.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nível/Cargo</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Casa de Axé Associada</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ambiente</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-50/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {u.foto ? (
                            <img className="h-8 w-8 rounded-full border border-slate-100" src={u.foto} alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold font-mono">
                              {u.email.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-xs font-bold text-slate-800">{u.nome || 'Usuário Sem Nome'}</div>
                          <div className="text-[10px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={u.role || Role.EDITOR}
                        onChange={(e) => handleChangeRole(u.uid, u.email, u.role || Role.EDITOR, e.target.value as Role)}
                        className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 outline-none focus:border-amber-500"
                      >
                        <option value={Role.MASTER}>MASTER</option>
                        <option value={Role.ADMIN_CASA}>ADMIN_CASA</option>
                        <option value={Role.EDITOR}>EDITOR</option>
                        <option value={Role.TESTADOR}>TESTADOR</option>
                        <option value={Role.BLOQUEADO}>BLOQUEADO</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={u.id_casa || ''}
                        onChange={(e) => handleChangeCasa(u.uid, u.email, e.target.value)}
                        className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 outline-none focus:border-amber-500 max-w-[200px]"
                      >
                        <option value="">Sem casa associada</option>
                        {casas.length === 0 ? (
                          <option value="casa_principal">Casa Principal</option>
                        ) : (
                          casas.map(casa => (
                            <option key={casa.id} value={casa.id}>{casa.nome}</option>
                          ))
                        )}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleChangeAmbiente(u.uid, u.email, 'producao')}
                          className={`px-2 py-1 rounded text-[10px] font-bold ${u.ambiente !== 'teste' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}
                        >
                          Produção
                        </button>
                        <button
                          onClick={() => handleChangeAmbiente(u.uid, u.email, 'teste')}
                          className={`px-2 py-1 rounded text-[10px] font-bold ${u.ambiente === 'teste' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}
                        >
                          Ambiente Teste
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleResetarSenha(u.email)}
                        className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                      >
                        Resetar Senha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'casas' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Casas de Axé Credenciadas</h3>
                <p className="text-xs text-slate-500 mt-1">Estrutura organizacional unificada sob o barramento federado do Portal.</p>
              </div>
              <button
                onClick={() => setShowNovaCasaModal(true)}
                className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md hover:from-[#D97706] hover:to-[#B45309] transition-all"
              >
                <Plus size={16} />
                Nova Casa de Axé
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome da Casa</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail Administrativo</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cadastrada Em</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {casas.map(casa => (
                    <tr key={casa.id} className="hover:bg-slate-50/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-800">
                        {casa.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-medium">
                        {casa.admin_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] text-slate-500">
                        {formatarTimestamp(casa.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] text-[#D97706] font-mono font-bold uppercase">
                        {casa.id}
                      </td>
                    </tr>
                  ))}
                  {casas.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400 italic">
                        Nenhuma Casa de Axé cadastrada no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'testes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gerenciar Testadores de Sistema */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase text-slate-700 tracking-wide">Testadores Registrados</h3>
                  <p className="text-[10px] text-slate-500">{testers.length} e-mails associados no config/acl</p>
                </div>
              </div>

              <form onSubmit={handleAddTester} className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={novoTesterEmail}
                  onChange={(e) => setNovoTesterEmail(e.target.value)}
                  placeholder="e-mail do desenvolvedor/testador"
                  className="flex-1 text-xs border border-slate-200 outline-none rounded-xl px-3 py-2 bg-slate-50 focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={savingTester}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1.5"
                >
                  {savingTester ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Adicionar
                </button>
              </form>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {testers.map(email => (
                  <div key={email} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100/80 p-2.5 rounded-xl hover:bg-slate-100/50 transition-colors">
                    <span className="font-medium text-slate-700">{email}</span>
                    <button
                      onClick={() => handleRemoveTester(email)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {testers.length === 0 && (
                  <p className="text-[11px] text-slate-400 italic text-center py-4">Nenhum desenvolvedor adicionado à lista de testadores de ACL.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sandbox & Massa de Dados de Demonstração */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-800 border-b border-slate-100 pb-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase text-slate-700 tracking-wide">Massa de Demonstração</h3>
                  <p className="text-[10px] text-slate-500">Popular banco de dados isolado com dados fake</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Os dados criados por esta ferramenta receberão automaticamente a propriedade <span className="font-mono bg-amber-50 text-[#B45309] px-1 py-0.5 rounded text-[10px] font-bold">ambiente: "teste"</span> e estarão vinculados à Casa Principal.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed font-bold">
                  Dessa forma, apenas usuários configurados com permissão "TESTADOR" ou "MASTER" conseguirão visualizá-los, mantendo a integridade da sua contabilidade oficial e de membros reais em Produção intactas!
                </p>
              </div>
            </div>

            <div className="mt-6">
              {gerandoDemo ? (
                <div className="flex flex-col items-center justify-center p-3 gap-2 bg-[#FFFDF7] border border-amber-200 rounded-xl">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                  <span className="text-[11px] font-medium text-amber-700">{progressoDemo}</span>
                </div>
              ) : (
                <button
                  onClick={triggerGerarDadosDemo}
                  className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white py-3 px-6 rounded-xl font-bold tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  Gerar Massa de Dados Fake (Teste)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'seguranca' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <Shield className="text-red-600" size={18} />
                Logs de Segurança & Auditoria Contábil (security_logs)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Registros de tentativas de intrusão ou bypass nas regras de permissão ACL.</p>
            </div>
            <button
              onClick={handleClearSecurityLogs}
              disabled={clearingSecurityLogs || securityLogs.length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              {clearingSecurityLogs ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Limpando...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Limpar Logs
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data / Hora</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuário (E-mail)</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documento Tentado</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Motivo da Recusa</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {securityLogs.slice(0, 50).map(log => (
                  <tr key={log.id} className="hover:bg-red-50/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                      {formatarTimestamp(log.data)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-800">
                      {log.email || 'Usuário Desconhecido'}
                      <div className="text-[9px] text-slate-400 font-mono">UID: {log.uid || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                      {log.docPath || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-red-600">
                      {log.motivo || 'Sem detalhes fornecidos'}
                    </td>
                  </tr>
                ))}
                {securityLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-xs text-slate-400 font-medium italic">
                      Nenhuma tentativa de acesso não autorizado ou violação de segurança registrada. O ecossistema está íntegro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modais de Transição (Preservados das Versões Anteriores) */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center text-slate-800">
                <Users className="mr-3 text-emerald-600" size={24} />
                <h3 className="text-xl font-bold">Membros da Diretoria</h3>
              </div>
              <button onClick={() => setShowUsersModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-0 max-h-[60vh] overflow-y-auto">
              <ul className="divide-y divide-slate-100">
                {users.map(u => (
                  <li key={u.uid} className="p-4 flex items-center space-x-4">
                    {u.foto ? (
                      <img src={u.foto} alt={u.nome} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <User size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-800">{u.nome || 'Diretor sem nome'}</p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                    </div>
                  </li>
                ))}
                {users.length === 0 && (
                  <li className="p-8 text-center text-slate-500">Nenhum membro logado encontrado.</li>
                )}
              </ul>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => setShowUsersModal(false)}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
              <div className="flex items-center text-slate-800 w-full sm:w-auto justify-between">
                <div className="flex items-center">
                  <Activity className="mr-3 text-blue-600" size={24} />
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold">Últimos Logs</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Exibindo {filteredLogs.slice(0, 100).length} registros</p>
                  </div>
                </div>
                <button onClick={() => setShowLogsModal(false)} className="sm:hidden text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex bg-slate-200 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                  <button 
                    onClick={() => setLogFilter('5days')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${logFilter === '5days' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Últimos 5 dias
                  </button>
                  <button 
                    onClick={() => setLogFilter('all')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${logFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Tudo
                  </button>
                </div>
                <button onClick={() => setShowLogsModal(false)} className="hidden sm:block text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-0">
              {/* Versão Mobile: Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredLogs.slice(0, 100).map(log => (
                  <div key={log.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 inline-flex text-[10px] leading-4 font-bold rounded-md bg-slate-100 text-slate-500 border border-slate-200 uppercase">
                        {log.acao}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {formatarTimestamp(log.data)}
                      </span>
                    </div>
                    <div className="text-[12px] text-slate-700 font-bold truncate">
                      {log.usuario_email}
                    </div>
                    <div className="text-[12px] text-slate-600 leading-relaxed">
                      {log.resumo}
                    </div>
                  </div>
                ))}
              </div>

              {/* Versão Desktop: Tabela */}
              <table className="hidden md:table min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ação</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {filteredLogs.slice(0, 100).map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5 whitespace-nowrap text-[11px] text-slate-500 font-medium">
                        {formatarTimestamp(log.data)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 inline-flex text-[9px] leading-4 font-bold rounded-md bg-slate-100 text-slate-500 border border-slate-200 uppercase">
                          {log.acao}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-[11px] text-slate-700 font-bold">
                        {log.usuario_email}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-600 leading-relaxed">
                        {log.resumo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLogs.length === 0 && (
                <div className="px-6 py-12 text-center text-slate-400 text-sm italic">
                  Nenhum log encontrado para este período.
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => setShowLogsModal(false)}
                className="px-8 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all active:scale-95 text-sm shadow-lg shadow-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Casa de Axé Simples e Elegante */}
      {showNovaCasaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center text-slate-800 gap-2">
                <Home className="text-amber-600" size={24} />
                <h3 className="text-lg font-bold">Nova Casa de Axé</h3>
              </div>
              <button onClick={() => setShowNovaCasaModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateCasa} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nome do Terreiro / Casa</label>
                <input
                  type="text"
                  value={novaCasaNome}
                  onChange={(e) => setNovaCasaNome(e.target.value)}
                  placeholder="Ex: Ilê Axé Opô Afonjá"
                  className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl outline-none focus:border-amber-500 bg-slate-50/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">E-mail do Administrador Responsável</label>
                <input
                  type="email"
                  value={novaCasaAdminEmail}
                  onChange={(e) => setNovaCasaAdminEmail(e.target.value)}
                  placeholder="Ex: sacerdote@casa.com"
                  className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl outline-none focus:border-amber-500 bg-slate-50/50"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNovaCasaModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold text-xs py-3 rounded-xl border border-slate-200 hover:bg-slate-200 hover:text-slate-800 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCasa}
                  className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white py-3 rounded-xl font-bold text-xs tracking-wide shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  {savingCasa ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
