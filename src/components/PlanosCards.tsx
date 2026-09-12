import { Check, Flame, Shield, Users, HelpCircle, Landmark } from 'lucide-react';

interface PlanosCardsProps {
  onSelectPlano: (plano: string) => void;
}

export default function PlanosCards({ onSelectPlano }: PlanosCardsProps) {
  const planos = [
    {
      id: 'essencial',
      nome: 'ESSENCIAL',
      preco: '49',
      features: [
        'Acesso para 1 Casa de Axé',
        'Cadastro de até 50 membros',
        'Controle financeiro completo (Livro Caixa)',
        'Gestão de eventos e obrigações',
        'Suporte por e-mail e FAQ',
        'Aplicativo PWA (Instale no celular)',
      ],
      icon: Users,
      badge: null,
      color: 'slate',
    },
    {
      id: 'comunidade',
      nome: 'COMUNIDADE',
      preco: '97',
      features: [
        'Acesso para 1 Casa de Axé',
        'Cadastro de membros ILIMITADO',
        'Controle financeiro com relatórios avançados',
        'OCR inteligente: leitura de comprovantes com IA',
        'Relatórios de auditoria e PDF customizados',
        'Suporte prioritário via WhatsApp',
        'Aplicativo PWA com modo offline premium',
      ],
      icon: Flame,
      badge: 'MAIS POPULAR',
      color: 'amber',
    },
    {
      id: 'federacao',
      nome: 'FEDERAÇÃO',
      preco: '197',
      features: [
        'Gerenciamento de MÚLTIPLAS Casas de Axé',
        'Membros e usuários ilimitados em todas as casas',
        'Dashboard Master unificado para o Sacerdote Sênior',
        'Customização avançada de relatórios e logo',
        'Leitura automatizada via IA ilimitada',
        'Treinamento ao vivo para os administradores das casas',
        'Suporte VIP 24h e Backup em Nuvem dedicado',
      ],
      icon: Landmark,
      badge: 'COMPLETO',
      color: 'gold',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div id="planos-cards-container" className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {planos.map((plano) => {
          const IconComponent = plano.icon;
          const isAmber = plano.color === 'amber';
          const isGold = plano.color === 'gold';

          return (
            <div
              key={plano.id}
              id={`plano-card-${plano.id}`}
              className={`relative flex flex-col rounded-3xl bg-white p-8 transition-all hover:scale-[1.02] duration-300 ${
                isAmber 
                  ? 'border-2 border-[#D97706] shadow-xl ring-4 ring-[#FDE68A]/30 scale-[1.03] md:-translate-y-2' 
                  : isGold
                    ? 'border-2 border-[#9A3412] shadow-lg ring-2 ring-[#B45309]/10'
                    : 'border border-slate-200 shadow-md'
              }`}
            >
              {plano.badge && (
                <div
                  id={`plano-badge-${plano.id}`}
                  className={`absolute -top-4 right-6 rounded-full px-4 py-1 text-[10px] font-extrabold tracking-widest uppercase shadow-sm ${
                    isAmber 
                      ? 'bg-[#D97706] text-white' 
                      : 'bg-[#9A3412] text-white'
                  }`}
                >
                  {plano.badge}
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div
                  id={`plano-icon-bg-${plano.id}`}
                  className={`p-3 rounded-2xl ${
                    isAmber 
                      ? 'bg-[#FEF3C7] text-[#D97706]' 
                      : isGold
                        ? 'bg-[#FFEDD5] text-[#9A3412]'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <IconComponent size={24} />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                    {plano.nome}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-slate-800">
                      R$ {plano.preco}
                    </span>
                    <span className="text-xs text-slate-400 font-medium font-sans">
                      /mês
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 mb-6" />

              <ul className="space-y-4 mb-8 flex-1">
                {plano.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
                    <span className={`mt-0.5 shrink-0 rounded-full p-0.5 ${
                      isAmber ? 'bg-[#FEF3C7] text-[#D97706]' : isGold ? 'bg-[#FFEDD5] text-[#9A3412]' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Check size={12} className="stroke-[3]" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-3 mt-auto">
                <button
                  id={`btn-escolher-${plano.id}`}
                  onClick={() => onSelectPlano(plano.id)}
                  className={`w-full py-4 px-6 rounded-2xl text-xs font-black tracking-widest uppercase transition-all duration-200 shadow-md ${
                    isAmber
                      ? 'bg-[#D97706] hover:bg-[#B45309] text-white hover:shadow-[#D97706]/20'
                      : isGold
                        ? 'bg-[#9A3412] hover:bg-[#7C2D12] text-white hover:shadow-[#9A3412]/20'
                        : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-900/20'
                  }`}
                >
                  Começar Teste Grátis
                </button>

                <button
                  id={`btn-comprar-${plano.id}`}
                  onClick={() => window.location.href = `/api/checkout?plan=${plano.id}`}
                  className={`w-full py-4 px-6 rounded-2xl text-xs font-black tracking-widest uppercase transition-all duration-200 shadow-sm border-2 ${
                    isAmber
                      ? 'border-[#D97706] text-[#D97706] hover:bg-[#FEF3C7]'
                      : isGold
                        ? 'border-[#9A3412] text-[#9A3412] hover:bg-[#FFEDD5]'
                        : 'border-slate-900 text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Comprar Agora
                </button>
              </div>

              <p className="text-[10px] text-center text-slate-400 mt-4 font-medium">
                Teste por 7 dias grátis, sem compromisso ou cartão
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-16 text-center w-full">
        <a 
          href="https://wa.me/5514981570008?text=Ase%2C%20Quero%20informa%C3%A7%C3%B5es%20sobre%20o%20Plano%20ANUAL" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex flex-col items-center justify-center p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
        >
          <span className="text-emerald-800 text-lg sm:text-xl font-black uppercase tracking-wider mb-2">
            Plano Anual
          </span>
          <span className="text-emerald-600 text-sm font-bold mb-4">
            R$ 1.143,33/ano
          </span>
          <span className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors">
            Falar sobre o Plano Anual
          </span>
        </a>
      </div>
    </div>
  );
}
