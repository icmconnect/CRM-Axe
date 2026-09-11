import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { Info, Share2, Check, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useState } from 'react';
import React from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const saveUserToFirestore = async (user: any) => {
    const userDocRef = doc(db, 'users', user.uid);
    const updateData: any = {
      uid: user.uid,
      ultimo_login: serverTimestamp()
    };
    if (user.displayName) updateData.nome = user.displayName;
    if (user.email) updateData.email = user.email;
    if (user.photoURL) updateData.foto = user.photoURL;

    // We do NOT write 'role' or other metadata fields here because they are handled
    // by CadastroCasa (on initial sign-up) and securely managed by AuthContext.
    // This prevents overwriting 'ADMIN_CASA' and other custom roles back to 'user'.
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
      const result = await signInWithPopup(auth, provider);
      await saveUserToFirestore(result.user);
    } catch (error: any) {
      console.error('Login failed', error);
      setError('Falha ao entrar com Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserToFirestore(result.user);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await saveUserToFirestore(result.user);
      }
    } catch (error: any) {
      console.error('Auth error', error);
      if (error.code === 'auth/user-not-found') setError('E-mail não cadastrado. Clique em "Cadastre-se".');
      else if (error.code === 'auth/wrong-password') setError('Senha incorreta.');
      else if (error.code === 'auth/email-already-in-use') setError('Este e-mail já está cadastrado. Tente fazer login.');
      else if (error.code === 'auth/weak-password') setError('A senha deve ter pelo menos 6 caracteres.');
      else if (error.code === 'auth/invalid-email') setError('E-mail inválido.');
      else if (error.code === 'auth/operation-not-allowed') setError('O login por e-mail não está ativado no Firebase Console.');
      else setError('Erro: ' + (error.message || 'Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden bg-[#FCFBF8] p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md flex flex-col items-center bg-white p-6 sm:p-10 rounded-[2rem] shadow-2xl shadow-orange-100/50 border border-orange-50/50 max-h-[96vh] overflow-y-auto">
        {/* Logo */}
        <div className="mb-4">
          <Logo variant="vertical" className="h-44 sm:h-56 w-auto mx-auto object-contain drop-shadow-xl" />
        </div>

        {/* Typography */}
        <div className="text-center mb-6">
          <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#B45309] uppercase mb-2 opacity-80">
            ERP Sistema Gerenciamento
          </p>
          <div className="text-[#64748B] text-sm sm:text-base leading-relaxed px-2">
            <p>Gestão profissional para casas de axé.</p>
          </div>
        </div>

        {/* Google Login Button */}
        <div className="w-full text-center mb-2">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">
            Entre com sua conta Google; é mais prático e rápido.
          </p>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border-2 border-slate-200 hover:border-[#E87000] text-slate-700 font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Entrar com Google
          </button>
        </div>

        <div className="w-full flex items-center gap-4 my-4">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">ou use e-mail</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleEmailAuth} className="w-full space-y-3.5 mb-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#E87000] focus:border-[#E87000] outline-none transition-all text-sm"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#E87000] focus:border-[#E87000] outline-none transition-all text-sm"
              required
            />
          </div>

          {error && <p className="text-red-500 text-[10px] font-medium px-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
          >
            {loading ? (
              <span className="animate-pulse">Processando...</span>
            ) : isRegistering ? (
              <><UserPlus size={18} /> Criar Conta</>
            ) : (
              <><LogIn size={18} /> Entrar no Sistema</>
            )}
          </button>

          {!isRegistering && (
            <div className="text-right pt-1">
              <Link
                to="/recuperar-senha"
                className="text-xs text-[#E87000] hover:underline font-bold"
              >
                Esqueci minha senha?
              </Link>
            </div>
          )}
        </form>

        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-[#E87000] font-bold text-xs hover:underline mb-4"
        >
          {isRegistering ? 'Já tenho uma conta? Entrar' : 'Não tem conta? Cadastre-se'}
        </button>

        {/* Share Button */}
        <button
          onClick={handleCopyLink}
          className="w-full bg-slate-50 text-slate-500 hover:text-[#E87000] font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 mb-4 flex items-center justify-center gap-2 text-sm"
        >
          {copied ? (
            <><Check size={18} className="text-emerald-500" /> Link Copiado!</>
          ) : (
            <><Share2 size={18} /> Compartilhar Acesso</>
          )}
        </button>

        {/* Tip Card */}
        <div className="w-full bg-red-50 border border-red-100 rounded-2xl p-3.5 sm:p-4 shadow-sm mb-3">
          <div className="flex items-center mb-1.5 text-red-600 font-bold text-[10px] sm:text-xs tracking-wider uppercase">
            <Info size={16} className="mr-2" />
            Aviso Importante:
          </div>
          <p className="text-red-700 text-[10px] sm:text-xs leading-relaxed font-medium">
            Para melhor funcionamento, abra este link diretamente no <strong className="font-bold underline">Chrome</strong> ou <strong className="font-bold underline">Safari</strong>. Evite usar o navegador interno do WhatsApp.
          </p>
        </div>

        {/* Shared Computer Notice */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm">
          <p className="text-slate-600 text-[10px] sm:text-xs leading-relaxed text-center font-medium">
            Em computadores compartilhados, encerre sua sessão ao terminar e evite manter dados da plataforma disponíveis offline.
          </p>
        </div>
      </div>
    </div>
  );
}
