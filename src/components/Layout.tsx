import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, DollarSign, LogOut, Download, Calendar, FileText, Shield, Bell, Moon, Sun, Menu, X, ExternalLink } from 'lucide-react';
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
                      <div className="bg-\[#C59B4B\]/20 text-\[#C59B4B\] p-2 rounded-lg mr-3">
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { casa, userRole, assumedCasaId, assumeCasa } = useAuth();
  const currentUser = auth.currentUser;
  const [nomeCasa, setNomeCasa] = useState<string>('');

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    async function buscarNomeCasa() {
      if (userRole?.role === 'MASTER' || userRole?.email === 'gustavomacedo.consultor@gmail.com') {
        setNomeCasa('Ase Connect');
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
    <div className="h-screen w-full flex flex-col bg-slate-50 dark:bg-[#1A1A1A] font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200 overflow-hidden">
      {assumedCasaId && (
        <div className="w-full bg-[#C59B4B] text-white z-50 py-1.5 px-4 flex justify-between items-center text-xs font-bold shadow-md shrink-0">
          <span>Modo Master: Visualizando dados da casa {assumedCasaId}</span>
          <button onClick={() => assumeCasa(null)} className="bg-white text-[#C59B4B] px-3 py-0.5 rounded hover:bg-slate-50 transition-colors">
            Sair e Voltar ao Admin
          </button>
        </div>
      )}

      <div className="flex-1 flex w-full h-full overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-sm z-30 transition-colors duration-200">
          {/* Logo Container */}
          <div className="py-4 px-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
            <Logo variant="sidebar" src="/assets/images/logo-menu.png" className="w-32 sm:w-36 h-auto object-contain mx-auto" />
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
            <ul>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path} className="mb-1.5">
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-[#C59B4B]/10 text-[#C59B4B] dark:bg-[#C59B4B]/20 dark:text-[#E5B869] font-semibold shadow-xs border border-[#C59B4B]/25' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-medium'
                      }`}
                    >
                      <item.icon className={`mr-3 shrink-0 ${isActive ? 'text-[#C59B4B] dark:text-[#E5B869]' : 'text-slate-400 dark:text-slate-400'}`} size={20} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sidebar Footer Actions */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-2.5 shrink-0">
            {deferredPrompt && (
              <button onClick={handleInstallClick} className="flex items-center justify-center w-full px-4 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors text-sm font-semibold shadow-sm">
                <Download className="mr-2 shrink-0" size={18} /> Instalar App
              </button>
            )}
            <button onClick={() => signOut(auth)} className="flex items-center justify-center w-full px-4 py-2.5 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-semibold">
              <LogOut className="mr-2 shrink-0" size={18} /> Sair
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay & Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <aside className="relative w-64 max-w-[80vw] bg-white dark:bg-slate-800 h-full flex flex-col shadow-2xl z-10 border-r border-slate-200 dark:border-slate-700">
              <div className="py-3 px-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
                <Logo variant="sidebar" src="/assets/images/logo-menu.png" className="w-32 sm:w-36 h-auto object-contain" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors"
                  aria-label="Fechar menu"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
                <ul>
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={item.path} className="mb-1">
                        <Link
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isActive 
                              ? 'bg-[#C59B4B]/10 text-[#C59B4B] dark:bg-[#C59B4B]/20 dark:text-[#E5B869] font-semibold shadow-xs border border-[#C59B4B]/25' 
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <item.icon className={`mr-3 shrink-0 ${isActive ? 'text-[#C59B4B] dark:text-[#E5B869]' : 'text-slate-400'}`} size={20} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-2 shrink-0">
                {deferredPrompt && (
                  <button onClick={handleInstallClick} className="flex items-center justify-center w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold">
                    <Download className="mr-2" size={18} /> Instalar App
                  </button>
                )}
                <button onClick={() => signOut(auth)} className="flex items-center justify-center w-full px-4 py-2.5 text-red-700 bg-red-50 rounded-xl text-sm font-semibold">
                  <LogOut className="mr-2" size={18} /> Sair
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto relative bg-slate-50 dark:bg-[#1A1A1A] pb-24 md:pb-0">
          {/* Top Bar with Notifications & Mobile Hamburger */}
          <div className="sticky top-0 z-20 bg-slate-50/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between transition-colors duration-200 shrink-0">
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Abrir menu"
              >
                <Menu size={22} />
              </button>
            </div>
            <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate mx-2 text-center md:text-left flex-1">
              {nomeCasa || '...'}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
               <a
                 href="https://sacerdote.aseconnect.com.br/"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#C59B4B]/10 hover:bg-[#C59B4B]/20 dark:bg-[#C59B4B]/15 dark:hover:bg-[#C59B4B]/25 text-[#C59B4B] dark:text-[#E5B869] border border-[#C59B4B]/30 hover:border-[#C59B4B]/50 rounded-lg text-xs font-semibold transition-all duration-200 shadow-xs group shrink-0"
                 title="Conheça o Sacerdote"
               >
                 <span className="hidden sm:inline whitespace-nowrap">Conheça o Sacerdote</span>
                 <ExternalLink size={13} className="opacity-80 group-hover:opacity-100 transition-opacity shrink-0" />
               </a>

               <button 
                 onClick={toggleTheme}
                 className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0"
                 title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
               >
                 {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
               </button>
               <NotificationsDropdown />
            </div>
          </div>
          
          {/* Trial Status / Billing Banner */}
          <TrialBanner />

          <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-8">
            <Outlet />
          </div>
          
          {/* Footer */}
          <footer className="mt-auto w-full max-w-7xl mx-auto p-6 flex flex-col items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
            <Logo variant="vertical" src="/assets/images/logo-rodape.png" className="h-14 sm:h-16 w-auto mb-2 object-contain mx-auto" />
            <p className="text-[10px] text-slate-400 font-medium">Gestão Profissional para Casas de Axé</p>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around items-center h-20 px-2 z-40 pb-safe shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-[#C59B4B]' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <item.icon size={22} className={isActive ? 'text-[#C59B4B]' : 'text-slate-400 dark:text-slate-400'} />
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
        <button onClick={() => signOut(auth)} className="flex flex-col items-center justify-center text-red-600 dark:text-red-400">
          <LogOut size={22} />
          <span className="text-[10px] font-medium">Sair</span>
        </button>
      </nav>
    </div>
  );
}
