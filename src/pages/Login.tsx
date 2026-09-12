import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { Logo } from '../components/Logo';
import { useState, FormEvent } from 'react';
import { Mail, Lock, Info, Share2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const saveUserToFirestore = async (user: any) => {
    const userDocRef = doc(db, 'users', user.uid);
    const updateData: any = {
      uid: user.uid,
      ultimo_login: serverTimestamp()
    };
    if (user.displayName) updateData.nome = user.displayName;
    if (user.email) updateData.email = user.email;
    if (user.photoURL) updateData.foto = user.photoURL;

    // Preserva permissões existentes e salva dados básicos
    await setDoc(userDocRef, updateData, { merge: true });

    try {
      const now = new Date();
      await addDoc(collection(db, 'audit_logs'), {
        data: now.toISOString(),
        usuario_email: user.email || 'Desconhecido',
        acao: 'LOGIN',
        resumo: `Usuário acessou o sistema às ${now.toLocaleTimeString('pt-BR')}`
      });
    } catch (e) {
      console.error('Erro ao registrar log de login', e);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, provider);
      await saveUserToFirestore(result.user);
    } catch (err: any) {
      console.error('Login failed', err);
      setError('Falha ao entrar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserToFirestore(result.user);
    } catch (err: any) {
      console.error('Auth error', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Senha incorreta.');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else {
        setError('Não foi possível entrar. Verifique seus dados.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFBF8] p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md flex flex-col items-center bg-white p-7 sm:p-9 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 my-auto">
        {/* Logo */}
        <div className="mb-2">
          <Logo variant="vertical" src="/assets/images/logo-nova.png" className="h-28 sm:h-32 w-auto mx-auto object-contain drop-shadow-xl" />
        </div>

        {/* Texto de Apoio */}
        <p className="text-xs sm:text-sm font-medium text-slate-500 mb-5 text-center">
          Acesse sua conta
        </p>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60 shadow-xs text-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          <span>{loading ? 'Acessando...' : 'Entrar com Google'}</span>
        </button>

        {/* Divisor Elegante */}
        <div className="w-full flex items-center gap-3 my-5">
          <div className="h-px bg-slate-200/80 flex-1"></div>
          <span className="text-slate-400 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase">
            ou use e-mail
          </span>
          <div className="h-px bg-slate-200/80 flex-1"></div>
        </div>

        {/* Formulário de E-mail e Senha */}
        <form onSubmit={handleEmailAuth} className="w-full space-y-3">
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706] outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D97706]/20 focus:border-[#D97706] outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400"
              required
            />
          </div>

          {/* Links Auxiliares */}
          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <Link
              to="/recuperar-senha"
              className="text-slate-500 hover:text-[#D97706] transition-colors"
            >
              Esqueci minha senha
            </Link>
            <Link
              to="/cadastro"
              className="text-slate-500 hover:text-[#D97706] transition-colors"
            >
              Não tem conta? <span className="font-semibold text-[#D97706]">Cadastre-se</span>
            </Link>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-2.5 text-center font-medium">
              {error}
            </p>
          )}

          {/* Botão Principal Entrar no Sistema */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-semibold py-3 rounded-xl shadow-sm transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 text-sm mt-1"
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        {/* Botão Compartilhar Acesso */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full mt-4 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 font-medium py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-xs active:scale-[0.99]"
        >
          {copied ? (
            <><Check size={14} className="text-emerald-600" /> Link copiado com sucesso!</>
          ) : (
            <><Share2 size={14} className="text-slate-400" /> Compartilhar Acesso</>
          )}
        </button>

        {/* Card Informativo Suave (Substituindo o aviso alarmante vermelho) */}
        <div className="w-full mt-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start gap-2.5 text-slate-500">
          <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[11px] sm:text-xs leading-relaxed">
            <span className="font-semibold text-slate-700">Recomendação:</span> Para melhor experiência, utilize o navegador <strong className="font-medium text-slate-700">Chrome</strong> ou <strong className="font-medium text-slate-700">Safari</strong> fora do WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
