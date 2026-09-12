const fs = require('fs');

// Patch PlanosCards
let codePlanos = fs.readFileSync('src/components/PlanosCards.tsx', 'utf8');

const regexEssencial = /'Cadastro de até 50 membros',/;
codePlanos = codePlanos.replace(regexEssencial, "'Cadastro de até 25 membros', 'Acesso para 2 usuários da diretoria',");

const regexComunidade = /'Cadastro de membros ILIMITADO',/;
codePlanos = codePlanos.replace(regexComunidade, "'Cadastro de até 70 membros', 'Acesso para 4 usuários da diretoria',");

const regexFederacao = /'Membros e usuários ilimitados em todas as casas',/;
codePlanos = codePlanos.replace(regexFederacao, "'Membros ilimitados e 5 usuários com acesso',");

fs.writeFileSync('src/components/PlanosCards.tsx', codePlanos);


// Patch LandingPage
let codeLanding = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// Trust Badge
const trustRegex = /<span className="text-\[10px\] font-black uppercase tracking-widest text-slate-500 mt-1 block">[^<]*<\/span>/;
codeLanding = codeLanding.replace(trustRegex, '<span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1 block">Desenvolvido para Casas de Axé</span>');

// WhatsApp Button
const btnWhats = `
      {/* Botão Flutuante WhatsApp */}
      <a href="https://wa.me/5514981570008" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-4 shadow-xl z-50 transition-transform hover:scale-110 flex items-center justify-center">
        <MessageCircle size={28} />
      </a>
`;

codeLanding = codeLanding.replace('    </div>\n  );\n}', btnWhats + '    </div>\n  );\n}');

fs.writeFileSync('src/pages/LandingPage.tsx', codeLanding);
