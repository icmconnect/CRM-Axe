const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Insert Trial Banner
const importRe = /import \{ (.*) \} from 'lucide-react';/;
code = code.replace(importRe, "import { $1, AlertTriangle, ArrowRight } from 'lucide-react';");

// Find where to insert Banner, usually before header
const returnRe = /(return \(\n\s*<div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">)/;

const trialLogic = `
  // Logic for Trial Banner
  const trialAte = casa?.trial_ate ? new Date(casa.trial_ate) : null;
  const hoje = new Date();
  let diasRestantes = -1;
  let showTrialBanner = false;
  
  if (trialAte && casa?.status === 'trial') {
    const diffTime = trialAte.getTime() - hoje.getTime();
    diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diasRestantes <= 2) {
      showTrialBanner = true;
    }
  }

  const getPlanLimit = () => {
    const planLimits: Record<string, { members: number, users: number }> = {
      'price_1UEag7BejuJh61udGrM5w6oo': { members: 25, users: 2 }, // Essencial
      'price_1UEahkBejuJh61udF758QtDQ': { members: 70, users: 4 }, // Comunidade
      'price_1UEaiWBejuJh61uduZGizvCM': { members: 9999, users: 5 }, // Federação
      'price_1UEajLBejuJh61udOqNGOrVQ': { members: 9999, users: 5 }, // Anual
    };
    return planLimits[casa?.plano || ''] || { members: 25, users: 2 };
  };
  
  const limits = getPlanLimit();
  
  const trialBannerHTML = showTrialBanner ? (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-full text-red-600">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 className="text-red-800 font-bold text-sm">⚠️ \${diasRestantes <= 0 ? 'Último dia de trial!' : \`Faltam \${diasRestantes} dias para o fim do trial!\`}</h3>
          <p className="text-red-600 text-xs mt-1">Escolha um plano para não perder o acesso ao sistema.</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="flex-1 md:w-48">
          <div className="flex justify-between text-[10px] text-red-600 font-bold mb-1">
            <span>Progresso</span>
            <span>\${Math.max(0, 7 - diasRestantes)}/7 dias</span>
          </div>
          <div className="h-2 w-full bg-red-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full" style={{ width: \`\${Math.min(100, Math.max(0, (7 - diasRestantes) / 7 * 100))}%\` }} />
          </div>
        </div>
        
        <button 
          onClick={() => window.location.href = '#/planos'} // Assuming there is a /planos or checkout
          className="shrink-0 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors flex items-center gap-2 shadow-sm"
        >
          Escolher Plano <ArrowRight size={16} />
        </button>
      </div>
    </div>
  ) : null;
`;

// Insert the logic
const funcHeader = /export default function Dashboard\(\) \{[\s\S]*?(?=return \()/;
const existingLogic = code.match(funcHeader)[0];
code = code.replace(existingLogic, existingLogic + trialLogic);

// Insert the HTML
code = code.replace(returnRe, `$1\n      {trialBannerHTML}`);

// Usage Metric Card - find the stats grid
const statsGridRe = /(<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">[\s\S]*?<\/div>\s*<\/div>)/;

// Wait, the stats grid has 4 items. Let's add the Usage limits below it or inside it.
const usageCardHTML = `
      {/* Limits & Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Uso do Plano (Membros)</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
              {membros.length} / {limits.members > 9000 ? 'Ilimitado' : limits.members}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#C59B4B] rounded-full" 
              style={{ width: \`\${limits.members > 9000 ? 100 : Math.min(100, (membros.length / limits.members) * 100)}%\` }} 
            />
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1E1E1E] p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Uso do Plano (Usuários)</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
              Límite do Plano: {limits.users}
            </span>
          </div>
          <p className="text-xs text-slate-500">Acesse as Configurações para gerenciar diretores.</p>
        </div>
      </div>
`;

code = code.replace(/(<h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">Próximos Eventos<\/h2>)/, usageCardHTML + '\n      $1');

fs.writeFileSync('src/pages/Dashboard.tsx', code);
