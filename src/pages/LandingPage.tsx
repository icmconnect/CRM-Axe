import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PlanosCards from '../components/PlanosCards';
import { Logo } from '../components/Logo';
import { 
  Shield, Sparkles, Phone, MessageSquare, Menu, X, Check, Globe, HelpCircle, 
  ChevronDown, ChevronUp, BarChart3, Users, Calendar, Brain, Smartphone, Landmark,
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FAQ State
  const [faqOpenIdx, setFaqOpenIdx] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    if (faqOpenIdx === idx) {
      setFaqOpenIdx(null);
    } else {
      setFaqOpenIdx(idx);
    }
  };

  const handleSelectPlano = (planoId: string) => {
    navigate(`/cadastro?plano=${planoId}`);
  };

  const faqItems = [
    {
      q: 'Preciso cadastrar cartão de crédito para fazer o teste grátis?',
      a: 'Não! Você pode usar a plataforma livremente por 7 dias para testar todas as funcionalidades. Somente ao término do período você escolhe um plano para continuar.',
    },
    {
      q: 'É possível gerenciar mais de um terreiro ou casa no mesmo sistema?',
      a: 'Sim, absolutamente! Com o plano Federação, um sacerdote sênior pode alternar instantaneamente entre múltiplos terreiros no mesmo painel unificado.',
    },
    {
      q: 'Os dados do meu terreiro estão de fato protegidos contra olhares curiosos?',
      a: 'A segurança é nossa maior prioridade. Adotamos o isolamento estrito de dados (multitenancy hermético via ACL no Firestore). Nenhuma casa ou usuário comum possui meios de ler dados de outro terreiro.',
    },
    {
      q: 'O aplicativo funciona no celular mesmo offline?',
      a: 'Sim! Nosso sistema é um PWA (Progressive Web App). Você pode adicioná-lo na tela inicial do seu celular, e os dados essenciais permanecem disponíveis offline para leitura rápida.',
    },
    {
      q: 'Como funciona a leitura automática de comprovantes por IA?',
      a: 'Basta tirar uma foto do recibo físico ou anexar o PDF de um comprovante no menu Financeiro. Nossa inteligência artificial do Google analisa o texto e preenche os campos de valor, data e descrição automaticamente!',
    },
    {
      q: 'Como posso cancelar minha assinatura se eu mudar de ideia?',
      a: 'A assinatura é mensal e sem fidelidade obrigatória. Você pode solicitar o cancelamento a qualquer hora diretamente pelo painel e exportar seus relatórios.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-slate-800 font-sans selection:bg-[#FDE68A] scroll-smooth">
      {/* HEADER / NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 filter drop-shadow-md">
              <Logo />
            </div>
            <div>
              <span className="text-[#D97706] text-[9px] uppercase tracking-widest font-extrabold block">Portal Oficial</span>
              <h1 className="text-sm font-bold font-serif text-slate-900 tracking-tight">Portal dos Sacerdotes</h1>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <a href="#funcionalidades" className="hover:text-[#D97706] transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-[#D97706] transition-colors">Como Funciona</a>
            <a href="#planos" className="hover:text-[#D97706] transition-colors">Planos</a>
            <a href="#depoimentos" className="hover:text-[#D97706] transition-colors">Depoimentos</a>
            <a href="#faq" className="hover:text-[#D97706] transition-colors">Perguntas</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-xs font-bold tracking-wider uppercase text-slate-600 hover:text-[#D97706] transition-colors"
            >
              Já tenho acesso
            </Link>
            <button
              onClick={() => navigate('/cadastro')}
              className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs tracking-wider uppercase py-3 px-6 rounded-2xl transition-all shadow-md"
            >
              Experimentar Grátis
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden text-slate-600 focus:outline-none p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 px-4 py-6 space-y-4 animate-in slide-in-from-top-4">
            <a 
              href="#funcionalidades"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left text-xs font-bold uppercase tracking-wider text-slate-600 focus:outline-none"
            >
              Funcionalidades
            </a>
            <a 
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left text-xs font-bold uppercase tracking-wider text-slate-600 focus:outline-none"
            >
              Como Funciona
            </a>
            <a 
              href="#planos"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left text-xs font-bold uppercase tracking-wider text-slate-600 focus:outline-none"
            >
              Planos
            </a>
            <a 
              href="#depoimentos"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left text-xs font-bold uppercase tracking-wider text-slate-600 focus:outline-none"
            >
              Depoimentos
            </a>
            <a 
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left text-xs font-bold uppercase tracking-wider text-slate-600 focus:outline-none"
            >
              Perguntas frequentes
            </a>
            <hr className="border-slate-100" />
            <div className="flex flex-col gap-3">
              <Link 
                to="/login"
                className="text-center text-xs font-bold tracking-wider uppercase text-slate-600 py-3 block"
              >
                Já tenho acesso
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/cadastro');
                }}
                className="w-full bg-[#D97706] text-white font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider text-center"
              >
                Criar Minha Conta Grátis
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        {/* Adorno de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]/40 mb-6 shadow-sm">
            <Sparkles size={12} />
            Plataforma 100% Brasileira e Profissional
          </span>

          <h2 className="text-4xl sm:text-6xl font-serif font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Gestão Integral, Unificada e Segura para sua <span className="text-[#D97706] relative">Casa de Axé</span>
          </h2>

          <p className="text-slate-500 text-sm sm:text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
            Organize filhos de santo, mensalidades, doações e as obrigações da sua comunidade religiosa. Tudo em um só lugar com relatórios em PDF de excelência corporativa.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/cadastro')}
              className="w-full sm:w-auto bg-[#D97706] hover:bg-[#B45309] text-white font-bold px-10 py-5 rounded-2xl shadow-xl hover:shadow-[#D97706]/20 transition-all active:scale-[0.98] duration-200 text-xs tracking-widest uppercase flex items-center justify-center gap-2"
            >
              Começar Teste Grátis de 7 Dias
              <ArrowRight size={16} />
            </button>
            
            <a
              href="https://wa.me/5521999999999" 
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-600 font-bold px-8 py-5 rounded-2xl transition-all duration-200 text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-sm"
            >
              <Phone size={16} className="text-emerald-500" />
              Chamar no WhatsApp
            </a>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
            <span>• Sem cartão de crédito</span>
            <span>• Cancele quando quiser</span>
            <span>• Dados privados e criptografados</span>
          </div>
        </div>
      </section>

      {/* Seção 2: Grid de Funcionalidades */}
      <section id="funcionalidades" className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-xs font-black tracking-widest text-[#D97706] uppercase">Controle Total</h3>
            <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-slate-900 mt-2">
              Todas as ferramentas que seu Terreiro precisa para prosperar
            </h2>
            <p className="text-sm text-slate-500 mt-3 font-medium">
              Esqueça os cadernos antigos e planilhas confusas. Tenha controle total na palma da sua mão com absoluto sigilo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Funcionalidade 1 */}
            <div className="bg-[#FFFDF7] border border-slate-100 p-8 rounded-3xl hover:shadow-xl transition-all duration-300">
              <div className="p-4 bg-[#FEF3C7] text-[#D97706] rounded-2xl w-fit mb-6">
                <BarChart3 size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Gestão Financeira
              </h4>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed font-semibold">
                Controle o livro caixa de forma precisa: mensalidades de filhos de santo, doações, despesas com rituais e materiais, tudo catalogado com relatórios em PDF.
              </p>
            </div>

            {/* Funcionalidade 2 */}
            <div className="bg-[#FFFDF7] border border-slate-100 p-8 rounded-3xl hover:shadow-xl transition-all duration-300">
              <div className="p-4 bg-[#FEF3C7] text-[#D97706] rounded-2xl w-fit mb-6">
                <Users size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Cadastro de Membros
              </h4>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed font-semibold">
                Ficha completa de filhos de santo: data de feitura, data de herança, cargo espiritual (Ekedi, Ogã, Iaô), telefone, endereço e histórico de contribuições individuais.
              </p>
            </div>

            {/* Funcionalidade 3 */}
            <div className="bg-[#FFFDF7] border border-slate-100 p-8 rounded-3xl hover:shadow-xl transition-all duration-300">
              <div className="p-4 bg-[#FEF3C7] text-[#D97706] rounded-2xl w-fit mb-6">
                <Calendar size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Eventos e Obrigações
              </h4>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed font-semibold">
                Organize festas de caboclos, saídas de iaô, toques e obrigações anuais. Defina metas financeiras de arrecadação e monte listas de materiais necessários sob controle da diretoria.
              </p>
            </div>

            {/* Funcionalidade 4 */}
            <div className="bg-[#FFFDF7] border border-slate-100 p-8 rounded-3xl hover:shadow-xl transition-all duration-300">
              <div className="p-4 bg-[#FEF3C7] text-[#D97706] rounded-2xl w-fit mb-6">
                <Brain size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                IA de Comprovantes
              </h4>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed font-semibold">
                Tire foto de recibos, comprovantes bancários ou extratos de PIX. Nossa inteligência artificial lê e extrai na hora os campos para criação automática de lançamentos financeiros.
              </p>
            </div>

            {/* Funcionalidade 5 */}
            <div className="bg-[#FFFDF7] border border-slate-100 p-8 rounded-3xl hover:shadow-xl transition-all duration-300">
              <div className="p-4 bg-[#FEF3C7] text-[#D97706] rounded-2xl w-fit mb-6">
                <Shield size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Privacidade Absoluta
              </h4>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed font-semibold">
                Cada terreiro possui um container de dados perfeitamente selado via ACL do Firebase. Sacerdotes e diretores de outras casas não conseguem visualizar nenhuma informação do seu templo.
              </p>
            </div>

            {/* Funcionalidade 06 */}
            <div className="bg-[#FFFDF7] border border-slate-100 p-8 rounded-3xl hover:shadow-xl transition-all duration-300">
              <div className="p-4 bg-[#FEF3C7] text-[#D97706] rounded-2xl w-fit mb-6">
                <Smartphone size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Instale no Celular (PWA)
              </h4>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed font-semibold">
                Instale o Portal como um aplicativo direto na tela principal do seu celular Android ou iOS. Acesse rapidamente com segurança biométrica e sem ocupar espaço físico de memória.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section id="como-funciona" className="py-20 bg-[#FFFDF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-xs font-black tracking-widest text-[#D97706] uppercase">Jornada Simples</h3>
            <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-slate-900 mt-2">
              Seu terreiro estruturado em 3 passos fáceis
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Linha de conexão visual para desktop */}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-slate-200/60 -translate-y-1/2 -z-10" />

            {/* Passo 1 */}
            <div className="text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#0F172A] text-[#FFFDF7] font-serif font-black flex items-center justify-center text-lg mb-4 shadow-md ring-8 ring-slate-100">
                1
              </div>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Cadastre com Segurança</h4>
              <p className="text-xs text-slate-500 mt-3 max-w-xs leading-relaxed font-semibold">
                Crie sua conta em 1 minuto informando o nome do seu terreiro. Sem necessidade de cadastrar cartões de crédito.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#0F172A] text-[#FFFDF7] font-serif font-black flex items-center justify-center text-lg mb-4 shadow-md ring-8 ring-slate-100">
                2
              </div>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Cadastre sua Comunidade</h4>
              <p className="text-xs text-slate-500 mt-3 max-w-xs leading-relaxed font-semibold">
                Adicione os filhos de santo da sua casa e lance as primeiras mensalidades ou dotes arrecadados no Livro Caixa digital.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#D97706] text-white font-serif font-black flex items-center justify-center text-lg mb-4 shadow-md ring-8 ring-amber-100">
                3
              </div>
              <h4 className="text-xs font-black uppercase text-[#D97706] tracking-wider">Aproveite os Benefícios</h4>
              <p className="text-xs text-slate-500 mt-3 max-w-xs leading-relaxed font-semibold">
                Acompanhe o dízimo da casa, gere balancetes em PDF profissionais, configure obrigações espirituais e controle os materiais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Planos Section */}
      <section id="planos" className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h3 className="text-xs font-black tracking-widest text-[#D97706] uppercase">Valores Acessíveis</h3>
            <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-slate-900 mt-2">
              Planos que cabem na realidade de cada Terreiro
            </h2>
            <p className="text-sm text-slate-500 mt-3 font-medium">
              Faça a adesão sem taxas de setup. Você só paga se gostar ao fim dos 7 dias experimentais.
            </p>
          </div>

          <PlanosCards onSelectPlano={handleSelectPlano} />
        </div>
      </section>

      {/* Depoimentos Section */}
      <section id="depoimentos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-xs font-black tracking-widest text-[#D97706] uppercase">Relatos Reais</h3>
            <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-slate-900 mt-2">
              O que dizem os Zeladores de Santo parceiros
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Depoimento 1 */}
            <div className="bg-[#FFFDF7] border border-slate-100 p-8 rounded-3xl shadow-sm relative">
              <span className="text-4xl text-[#FEF3C7] font-serif absolute top-4 left-6 pointer-events-none">“</span>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold relative z-10 italic mt-4">
                "O Portal organizou integralmente a saúde financeira de nossa casa. Antes anotávamos as doações e mensalidades em cadernos velhos que se perdiam facilmente. Hoje prestamos contas aos ogãs e filhos com relatórios impressos profissionais."
              </p>
              <hr className="my-6 border-slate-100" />
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#D97706] font-serif font-black text-sm flex items-center justify-center">
                  M
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 leading-none">Mãe Maria</h5>
                  <span className="text-[10px] text-slate-400 mt-1 block">Yalorixá - Ilê Axé Omin</span>
                </div>
              </div>
            </div>

            {/* Depoimento 2 */}
            <div className="bg-[#FFFDF7] border border-slate-100 p-8 rounded-3xl shadow-sm relative">
              <span className="text-4xl text-[#FEF3C7] font-serif absolute top-4 left-6 pointer-events-none">“</span>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold relative z-10 italic mt-4">
                "A funcionalidade de leitura inteligente de comprovantes por IA nos poupa horas de trabalho. Meus diretores financeiros apenas fotografam os extratos recebidos no grupo do terreiro e a inteligência do sistema cadastra os lançamentos sozinhos."
              </p>
              <hr className="my-6 border-slate-100" />
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#D97706] font-serif font-black text-sm flex items-center justify-center">
                  J
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 leading-none">Pai José</h5>
                  <span className="text-[10px] text-slate-400 mt-1 block">Babalorixá - Ilê Axé Yemanjá</span>
                </div>
              </div>
            </div>

            {/* Depoimento 3 */}
            <div className="bg-[#FFFDF7] border border-slate-100 p-8 rounded-3xl shadow-sm relative">
              <span className="text-4xl text-[#FEF3C7] font-serif absolute top-4 left-6 pointer-events-none">“</span>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold relative z-10 italic mt-4">
                "Finalmente criaram uma ferramenta desenvolvida de verdade para a realidade social e religiosa de um terreiro de axé. Consigo gerenciar as obrigações anuais das filhas de santo sabendo exatamente quem já doou os panos e dotes devidos."
              </p>
              <hr className="my-6 border-slate-100" />
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#D97706] font-serif font-black text-sm flex items-center justify-center">
                  C
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 leading-none">Babalaô Carlos</h5>
                  <span className="text-[10px] text-slate-400 mt-1 block">Terreiro de Ogum Beira-Mar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h3 className="text-xs font-black tracking-widest text-[#D97706] uppercase">Dúvidas Frequentes</h3>
            <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-slate-900 mt-2">
              Perguntas Frequentes
            </h2>
            <p className="text-sm text-slate-500 mt-3 font-medium">
              Selecione as perguntas abaixo para sanar suas dúvidas sobre o Portal das Casas de Axé.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => {
              const isOpen = faqOpenIdx === idx;
              return (
                <div 
                  key={idx} 
                  id={`faq-item-${idx}`}
                  className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-slate-55/40 transition-colors focus:outline-none"
                  >
                    <span className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
                      {item.q}
                    </span>
                    <span className="text-[#D97706]">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs text-slate-500 leading-relaxed font-semibold border-t border-slate-50">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-[#0F172A] text-white overflow-hidden relative">
        <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none transform translate-y-1/3 translate-x-1/3">
          <div className="w-[500px] h-[500px] rounded-full border-[30px] border-[#D97706]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          <h2 className="text-3xl sm:text-5xl font-serif font-black leading-tight">
            Pronto para levar organização profissional ao seu terreiro?
          </h2>
          <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto">
            Abandone os riscos de perda de dados e gerencie dízimos, obrigações de orixá e relatórios financeiros com a melhor inteligência de mercado.
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate('/cadastro')}
              className="bg-[#D97706] hover:bg-[#B45309] text-white font-bold px-12 py-5 rounded-2xl text-xs tracking-widest uppercase transition-all duration-200 shadow-xl shadow-[#D97706]/10 hover:shadow-[#D97706]/20 active:scale-[0.98]"
            >
              Criar Minha Conta Gratuita
            </button>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
            7 dias livres de cobrança • Cancele em um clique
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-500 py-12 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 opacity-70">
              <Logo />
            </div>
            <div>
              <span className="font-serif font-bold text-slate-350 text-slate-300">Portal dos Sacerdotes</span>
              <p className="text-[10px] mt-0.5 text-slate-600">Gestão de Terreiros e Casas de Axé</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-slate-400 font-bold">
            <a href="#funcionalidades" className="hover:text-[#D97706] transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-[#D97706] transition-colors">Planos</a>
            <a href="https://wa.me/5514981570008?text=Ol%C3%A1%21%2520Gostaria%2520de%2520tirar%2520uma%2520d%25C3%25BAvida%2520sobre%2520o%2520Portal%2520dos%2520Sacerdotes." target="_blank" rel="noreferrer" className="hover:text-emerald-500 transition-colors">Contato</a>
            <span className="text-slate-700">|</span>
            <span className="text-[10px] leading-relaxed text-slate-600">WhatsApp Suporte: (14) 98157-0008</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-slate-900/60 text-center text-[10px] text-slate-700 font-medium">
          <p>© 2026 Portal dos Sacerdotes. Desenvolvido para a preservação estruturada de nossas comunidades tradicionais de matriz africana. Axé!</p>
        </div>
      </footer>
    </div>
  );
}
