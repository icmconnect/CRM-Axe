import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, DollarSign, LogOut, Download, Calendar, FileText, Shield, Bell, Moon, Sun } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useEffect, useState, useRef } from 'react';
import { Logo } from './Logo';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import TrialBanner from './TrialBanner';

function NotificationsDropdown() {
  const { membros, financeiro, eventos } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const today = new Date();
  today.setHours(0,0,0,0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  // 1. Pagamentos Pendentes (Inadimplentes)
  const inadimplentes = membros.filter(m => {
    return !financeiro.some(f => 
      f.id_membro === m.id && 
      f.tipo === 'Entrada' &&
      new Date(f.data).getMonth() === currentMonth &&
      new Date(f.data).getFullYear() === currentYear
    );
  });

  // 2. Trabalhos/Eventos Pendentes
  const eventosProximos = eventos.filter(e => {
    const eventDate = new Date(e.data);
    return eventDate >= today && eventDate <= nextWeek;
  });

  // 3. Aniversariantes do Mês
  const aniversariantes = membros.filter(m => {
    if (!m.nascimento) return false;
    const [, month] = m.nascimento.split('-');
    return parseInt(month) - 1 === currentMonth;
  });

  const totalNotifications = inadimplentes.length + eventosProximos.length + aniversariantes.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
        <Bell size={24} />
        {totalNotifications > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800">Notificações</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {totalNotifications === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">Nenhuma notificação no momento.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {inadimplentes.length > 0 && (
                  <Link to="/membros" onClick={() => setIsOpen(false)} className="block p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start">
                      <div className="bg-red-100 text-red-600 p-2 rounded-lg mr-3">
                        <DollarSign size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{inadimplentes.length} Pagamentos Pendentes</p>
                        <p className="text-xs text-slate-500 mt-0.5">Membros que ainda não contribuíram este mês.</p>
                      </div>
                    </div>
                  </Link>
                )}
                {eventosProximos.length > 0 && (
                  <Link to="/eventos" onClick={() => setIsOpen(false)} className="block p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start">
                      <div className="bg-amber-100 text-amber-600 p-2 rounded-lg mr-3">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{eventosProximos.length} Trabalhos Pendentes</p>
                        <p className="text-xs text-slate-500 mt-0.5">Eventos agendados para os próximos 7 dias.</p>
                      </div>
                    </div>
                  </Link>
                )}
                {aniversariantes.length > 0 && (
                  <Link to="/membros" onClick={() => setIsOpen(false)} className="block p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start">
                      <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg mr-3">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{aniversariantes.length} Aniversariantes do Mês</p>
                        <p className="text-xs text-slate-500 mt-0.5">Membros celebrando aniversário este mês.</p>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { casa, userRole } = useAuth();
  const currentUser = auth.currentUser;
  const [nomeCasa, setNomeCasa] = useState<string>('');

  useEffect(() => {
    async function buscarNomeCasa() {
      if (userRole?.role === 'MASTER' || userRole?.email === 'gustavomacedo.consultor@gmail.com') {
        setNomeCasa('Portal dos Sacerdotes');
        return;
      }
      
      if (!userRole?.id_casa) {
        setNomeCasa('Sem casa');
        return;
      }
      
      try {
        console.log('🔍 Buscando casa com ID:', userRole.id_casa);
        const casaDoc = await getDoc(doc(db, 'casas_axe', userRole.id_casa));
        
        if (casaDoc.exists()) {
          const nome = casaDoc.data().nome;
          console.log('✅ Casa encontrada:', nome);
          setNomeCasa(nome);
        } else {
          console.warn('⚠️ Casa não encontrada para ID:', userRole.id_casa);
          // Tentar buscar pelo email do usuário
          const casasSnap = await getDocs(
            query(collection(db, 'casas_axe'), where('admin_email', '==', userRole.email))
          );
          if (!casasSnap.empty) {
            setNomeCasa(casasSnap.docs[0].data().nome);
          } else {
            setNomeCasa('Casa não encontrada');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar casa:', error);
        setNomeCasa('Erro ao carregar');
      }
    }
    
    if (userRole) {
      buscarNomeCasa();
    }
  }, [userRole?.id_casa, userRole?.role, userRole?.email]);

  // Redireção automática se conta estiver suspensa
  useEffect(() => {
    if (casa?.status === 'suspenso' && location.pathname !== '/suspenso') {
      navigate('/suspenso');
    }
  }, [casa, location.pathname, navigate]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        // Wake Lock is not supported or disallowed by permissions policy, which is expected in this environment.
      }
    };

    requestWakeLock();
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) wakeLock.release();
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    }
  }, [deferredPrompt]);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/membros', icon: Users, label: 'Membros' },
    { path: '/financeiro', icon: DollarSign, label: 'Financeiro' },
    { path: '/eventos', icon: Calendar, label: 'Eventos' },
    { path: '/relatorios', icon: FileText, label: 'Relatórios' },
  ];

  if (currentUser?.email === 'gustavomacedo.consultor@gmail.com') {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin' });
  }

  return (
    <div className="min-h-screen bg-[#FFFDF7] dark:bg-slate-900 flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex w-72 bg-white dark:bg-slate-800 border-r border-[#FDE68A]/30 dark:border-slate-700 flex-col h-screen sticky top-0 shadow-sm transition-colors duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-3">
            <Logo />
          </div>
          <h1 className="font-serif font-bold text-xl text-slate-900 dark:text-white leading-tight">Portal dos<br/>Sacerdotes</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-wide uppercase">Gestão Profissional</p>
        </div>
        <ul className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#FFF9E6] text-[#D97706] font-semibold shadow-sm border border-[#FDE68A]' 
                      : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <item.icon className={`mr-3 ${isActive ? 'text-[#D97706]' : 'text-slate-400'}`} size={22} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="p-4 border-t border-slate-100 space-y-3">
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="flex items-center justify-center w-full px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold shadow-md">
              <Download className="mr-2" size={18} /> Instalar App
            </button>
          )}
          <button onClick={() => signOut(auth)} className="flex items-center justify-center w-full px-4 py-3 text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition-colors text-sm font-semibold">
            <LogOut className="mr-2" size={18} /> Sair
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-0 overflow-y-auto h-screen w-full relative">
        {/* Top Bar with Notifications */}
        <div className="sticky top-0 z-40 bg-[#FFFDF7]/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between transition-colors duration-200">
          <div className="w-8 md:hidden"></div> {/* Placeholder para alinhar o título */}
          <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate mx-2 text-center flex-1">
            {nomeCasa || '...'}
          </h1>
          <div className="flex items-center gap-2">
             <button 
               onClick={toggleTheme}
               className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
               title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
             >
               {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
             </button>
             <NotificationsDropdown />
          </div>
        </div>
        
        {/* Trial Status / Billing Banner */}
        <TrialBanner />

        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-20 px-2 z-50 pb-safe shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-[#D97706]' : 'text-slate-500'
              }`}
            >
              <item.icon size={24} className={isActive ? 'text-[#D97706]' : 'text-slate-400'} />
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
        <button onClick={() => signOut(auth)} className="flex flex-col items-center justify-center text-red-600">
          <LogOut size={24} />
          <span className="text-[10px] font-medium">Sair</span>
        </button>
      </nav>
    </div>
  );
}
