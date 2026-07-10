import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MessageCircle, LogOut } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function ContaSuspensa() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const whatsappLink = "https://wa.me/5514981570008?text=Ol%C3%A1%21%20Minha%20casa%20est%C3%A1%20com%20acesso%20suspenso%20no%20Portal%20dos%20Sacerdotes.%20Como%20posso%20regularizar%3F";

  return (
    <div className="min-h-screen bg-red-50/40 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md flex flex-col items-center bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-red-200/50 border border-red-100 relative overflow-hidden">
        {/* Adorno visual superior vermelho */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-red-600" />

        {/* Logo */}
        <div className="w-20 h-20 mb-6 opacity-80 filter grayscale brightness-75">
          <Logo />
        </div>

        {/* Ícone Alerta Gigante */}
        <div className="bg-red-50 p-5 rounded-full text-red-500 animate-bounce mb-6 border border-red-150">
          <AlertTriangle size={48} strokeWidth={1.5} />
        </div>

        {/* Títulos */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
            Acesso Suspenso
          </h2>
          <div className="h-1 w-12 bg-red-500 rounded-full mx-auto mt-3" />
          <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">
            Identificamos uma pendência em sua assinatura do <strong>Portal dos Sacerdotes</strong>. 
            Para garantir a continuidade dos dados do seu Terreiro e liberar as funcionalidades, por favor, realize a regularização com nosso suporte financeiro.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="w-full space-y-3">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs tracking-wider uppercase transition-all duration-200 shadow-md flex items-center justify-center gap-2.5"
          >
            <MessageCircle size={18} />
            Regularizar no WhatsApp
          </a>

          <button
            onClick={handleLogout}
            className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-bold rounded-2xl text-xs tracking-wider uppercase transition-all duration-200 border border-slate-200/60 flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Sair da Conta (Logout)
          </button>
        </div>

        <p className="text-[10px] text-slate-400 mt-8 font-medium text-center">
          Dúvidas? Entre em contato pelo WhatsApp (14) 98157-0008
        </p>
      </div>
    </div>
  );
}
