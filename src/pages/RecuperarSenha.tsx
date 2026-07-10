import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, ArrowLeft, Loader2, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function RecuperarSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('Este endereço de e-mail não foi encontrado em nossa base de sacerdotes.');
      } else if (err.code === 'auth/invalid-email') {
        setError('O endereço de e-mail informado possui formato inválido.');
      } else {
        setError(err.message || 'Erro ao enviar e-mail de recuperação. Verifique e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md flex flex-col items-center bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-orange-100/40 border border-orange-50/50 relative overflow-hidden">
        {/* Adorno visual superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706]" />

        {/* Logo */}
        <div className="w-20 h-20 mb-6 drop-shadow-md">
          <Logo />
        </div>

        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-amber-50 text-[#D97706] rounded-2xl mb-3 border border-[#FEF3C7]">
            <KeyRound size={24} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-serif text-slate-900 tracking-tight">
            Recuperar Acesso
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed max-w-sm">
            Informe seu e-mail cadastrado e enviaremos um link seguro para a redefinição de sua senha de forma imediata.
          </p>
        </div>

        {/* Mensagem de Sucesso */}
        {success ? (
          <div className="w-full space-y-6">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col items-center text-center gap-3">
              <CheckCircle2 size={32} className="text-emerald-600" />
              <div>
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest">E-mail Enviado!</h4>
                <p className="text-[11px] text-emerald-700 leading-relaxed mt-2 font-semibold">
                  Se o e-mail estiver cadastrado, você receberá uma mensagem em breve com instruções detalhadas para criar uma nova senha.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs tracking-widest uppercase transition-all duration-200 shadow-md flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} />
              Ir para o Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="w-full space-y-5">
            {/* Campo E-mail */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="Informe seu e-mail cadastrado"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] outline-none transition-all text-sm shadow-sm"
                required
                disabled={loading}
              />
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-650 text-red-600 p-3 rounded-2xl text-[11px] font-bold flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75 text-xs tracking-wider uppercase font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-white" size={16} />
                  Processando...
                </>
              ) : (
                'Enviar Link de Recuperação'
              )}
            </button>

            {/* Link para Voltar */}
            <hr className="border-slate-100 my-4" />
            <div className="text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#D97706] transition-colors"
              >
                <ArrowLeft size={14} />
                Voltar para o Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
