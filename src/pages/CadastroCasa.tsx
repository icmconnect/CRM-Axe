import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, collection, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Shield, Sparkles, Phone, Mail, Lock, Landmark, User, ArrowRight, Loader2, Info } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function CadastroCasa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawPlano = searchParams.get('plano') || 'essencial';

  // State do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [nomeCasa, setNomeCasa] = useState('');
  const [password, setPassword] = useState('');
  const [termos, setTermos] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Se o usuário já estiver logado (e sem ter finalizado onboarding), ele pode ser redirecionado se necessário.
  // Mas como é um fluxo público de cadastro, mantemos limpo.

  const registrarSaaS = async (uid: string, userEmail: string, userNome: string, userWhatsapp: string, userCasaNome: string) => {
    // 1. Gerar ID Único da Casa de Axé
    const casaRef = doc(collection(db, 'casas_axe'));
    const casaId = casaRef.id;

    // 7 dias de trial a partir de hoje
    const seteDiasValidos = new Date();
    seteDiasValidos.setDate(seteDiasValidos.getDate() + 7);

    const nowStr = new Date().toISOString();

    // 2. Gravar os dados da Casa de Axé
    await setDoc(casaRef, {
      nome: userCasaNome,
      admin_email: userEmail.toLowerCase(),
      admin_nome: userNome,
      whatsapp: userWhatsapp,
      status: 'trial',
      trial_ate: seteDiasValidos.toISOString(),
      created_at: nowStr,
      plano: rawPlano,
    });

    const hasMasterEmail = userEmail.toLowerCase() === 'gustavomacedo.consultor@gmail.com';
    const role = hasMasterEmail ? 'MASTER' : 'ADMIN_CASA';
    const idCasa = hasMasterEmail ? 'master' : casaId;

    // 3. Gravar o Perfil do Usuário
    await setDoc(doc(db, 'users', uid), {
      uid,
      email: userEmail.toLowerCase(),
      nome: userNome,
      role: role,
      id_casa: idCasa,
      ambiente: 'producao',
      created_at: nowStr,
    });

    // 4. Registrar em Logs de Auditoria
    try {
      await setDoc(doc(collection(db, 'audit_logs')), {
        data: nowStr,
        usuario_email: userEmail.toLowerCase(),
        acao: 'CADASTRO_SaaS',
        resumo: `Nova Casa "${userCasaNome}" criada e Administrador [${userEmail}] cadastrado sob ID ${casaId}.`
      });
    } catch (logErr) {
      console.error('Erro de auditoria:', logErr);
    }

    return casaId;
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termos) {
      setError('Você precisa concordar com os termos de uso antes de continuar.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // 1. Criar login no Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Registrar SaaS
      const casaId = await registrarSaaS(
        userCredential.user.uid,
        email,
        nome,
        whatsapp,
        nomeCasa
      );

      // 3. Redirecionar para Boas-Vindas
      navigate(`/boas-vindas?id_casa=${casaId}`);
    } catch (err: any) {
      console.error('Erro de cadastro:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este endereço de e-mail já está sendo utilizado por outra conta.');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail informado possui formato inválido.');
      } else {
        setError(err.message || 'Houve um erro inexplicado no cadastro. Tente outro e-mail.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    
    if (!nomeCasa.trim()) {
      setError('Preencha o Nome da Casa de Axé antes de clicar em Continuar com Google.');
      return;
    }

    if (!whatsapp.trim()) {
      setError('Preencha o WhatsApp de contato antes de clicar em Continuar com Google.');
      return;
    }

    if (!termos) {
      setError('Aceite os termos de uso para prosseguir.');
      return;
    }

    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Se o usuário já está cadastrado, redireciona diretamente ao dashboard sem duplicidade
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        navigate('/');
        return;
      }

      const userEmail = user.email || '';
      const userNome = user.displayName || nome || userEmail.split('@')[0];

      const casaId = await registrarSaaS(
        user.uid,
        userEmail,
        userNome,
        whatsapp,
        nomeCasa
      );

      navigate(`/boas-vindas?id_casa=${casaId}`);
    } catch (err: any) {
      console.error('Google register error', err);
      setError('Erro de autenticação com o Google. Tente com e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col md:flex-row font-sans">
      {/* Lado Esquerdo - Info e Branding */}
      <div className="md:w-1/2 bg-gradient-to-br from-slate-900 to-slate-950 text-white p-8 sm:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Elemento de fundo sutil */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/2 translate-x-1/2">
          <div className="w-96 h-96 rounded-full border-[20px] border-[#D97706]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 filter drop-shadow-lg">
              <Logo />
            </div>
            <div>
              <span className="text-[#D97706] text-[10px] uppercase tracking-widest font-extrabold block">ERP Premium</span>
              <h2 className="text-xl font-bold font-serif tracking-tight">Portal dos Sacerdotes</h2>
            </div>
          </div>

          <div className="space-y-8 mt-12 max-w-md">
            <div>
              <span className="text-xs font-black tracking-widest text-[#D97706] uppercase bg-[#FEF3C7]/10 px-3.5 py-1 rounded-full border border-[#D97706]/20">
                SaaS Multi-Tenant
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight mt-4 leading-tight">
                Leve gestão profissional ao seu Terreiro de forma simples.
              </h1>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed">
              O Portal dos Sacerdotes centraliza tudo que seu terreiro precisa: contabilidade com auditoria, controle de membros, obrigações espirituais e relatórios instantâneos em PDF.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-[#FEF3C7]/10 p-2 rounded-xl text-[#D97706] border border-[#D97706]/10">
                  <Shield size={16} />
                </div>
                <p className="text-xs text-slate-300 font-semibold">Isolamento completo e privacidade absoluta de dados</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-[#FEF3C7]/10 p-2 rounded-xl text-[#F59E0B] border border-[#F59E0B]/10">
                  <Sparkles size={16} />
                </div>
                <p className="text-xs text-slate-300 font-semibold">Até 7 dias grátis para experimentar todas as ferramentas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 md:mt-0 relative z-10 pt-6 border-t border-slate-800">
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Plano selecionado para teste: <span className="text-[#F59E0B] font-bold uppercase">{rawPlano}</span>. <br />
            Cancele a qualquer momento pós-trial, sem multas contratuais.
          </p>
        </div>
      </div>

      {/* Lado Direito - Form de Cadastro */}
      <div className="md:w-1/2 p-6 sm:p-16 flex flex-col justify-center items-center">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-slate-805 text-slate-900 tracking-tight">
              Faça parte do Portal
            </h2>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Configure sua interface inteligente em menos de dois minutos.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Responsável */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Nome completo do Responsável espiritual"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] outline-none transition-all text-sm shadow-sm"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="E-mail profissional (para login)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] outline-none transition-all text-sm shadow-sm"
                required
                disabled={loading}
              />
            </div>

            {/* WhatsApp */}
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="tel"
                placeholder="WhatsApp (ex: 21999999999)"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] outline-none transition-all text-sm shadow-sm"
                required
                disabled={loading}
              />
            </div>

            {/* Nome da Casa */}
            <div className="relative">
              <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Nome do seu Terreiro / Casa de Axé"
                value={nomeCasa}
                onChange={(e) => setNomeCasa(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] outline-none transition-all text-sm shadow-sm"
                required
                disabled={loading}
              />
            </div>

            {/* Senha */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="Defina uma senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] outline-none transition-all text-sm shadow-sm"
                required
                disabled={loading}
              />
            </div>

            {/* Termos checkbox */}
            <div className="flex items-start gap-2.5 px-1 py-1">
              <input
                type="checkbox"
                id="termos-checkbox"
                checked={termos}
                onChange={(e) => setTermos(e.target.checked)}
                className="mt-1 accent-[#D97706] h-4 w-4 rounded border-slate-300 focus:ring-[#D97706]"
                required
              />
              <label htmlFor="termos-checkbox" className="text-slate-500 text-[11px] leading-snug">
                Eu aceito os <strong>Termos de Uso</strong> e as <strong> Políticas de Privacidade</strong> do Portal dos Sacerdotes.
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-2xl text-[11px] font-bold">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-75 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-white" size={18} />
                  Criando seu Espaço...
                </>
              ) : (
                <>
                  Criar Minha Conta Grátis
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">ou use login social</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          {/* Social Google Registrations */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full bg-white border-2 border-slate-200 hover:border-[#D97706] text-slate-700 font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 text-sm shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Continuar com o Google
          </button>

          <p className="text-center text-xs text-slate-400 mt-8 font-medium">
            Já tem acesso?{' '}
            <Link to="/login" className="text-[#D97706] font-bold hover:underline">
              Fazer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
