const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

const newFeatures = `
            {/* Funcionalidade 4 */}
            <div className="bg-[#FFFDF7] border border-slate-100 p-8 rounded-3xl hover:shadow-xl transition-all duration-300">
              <div className="p-4 bg-[#FEF3C7] text-[#D97706] rounded-2xl w-fit mb-6">
                <Globe size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                White-label & Logo Personalizada
              </h4>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed font-semibold">
                O sistema é seu. Insira a logo da sua Casa de Axé no painel e gere todos os relatórios PDF (Livro Caixa e Membros) com a sua própria identidade visual.
              </p>
            </div>

            {/* Funcionalidade 5 */}
            <div className="bg-[#FFFDF7] border border-slate-100 p-8 rounded-3xl hover:shadow-xl transition-all duration-300">
              <div className="p-4 bg-[#FEF3C7] text-[#D97706] rounded-2xl w-fit mb-6">
                <Shield size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Gerenciamento de Acessos
              </h4>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed font-semibold">
                Convide os membros da sua diretoria para o sistema com níveis de acesso limitados, garantindo que o Sacerdote sempre controle as permissões de edição.
              </p>
            </div>

            {/* Funcionalidade 6 */}
            <div className="bg-[#FFFDF7] border border-slate-100 p-8 rounded-3xl hover:shadow-xl transition-all duration-300">
              <div className="p-4 bg-[#FEF3C7] text-[#D97706] rounded-2xl w-fit mb-6">
                <Brain size={24} />
              </div>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Automação Inteligente (IA)
              </h4>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed font-semibold">
                Escaneie comprovantes de depósito, PIX ou recibos e nossa Inteligência Artificial preenche o livro caixa por você em instantes.
              </p>
            </div>
`;

code = code.replace(/<Brain size=\{24\} \/>\s*<\/div>\s*<h4[^>]*>\s*Inteligência Artificial\s*<\/h4>\s*<p[^>]*>[\s\S]*?<\/p>\s*<\/div>/, '');
code = code.replace(/<Smartphone size=\{24\} \/>\s*<\/div>\s*<h4[^>]*>\s*Aplicativo PWA\s*<\/h4>\s*<p[^>]*>[\s\S]*?<\/p>\s*<\/div>/, '');

const insertPos = code.indexOf('          </div>\n        </div>\n      </section>');
if (insertPos !== -1) {
  code = code.slice(0, insertPos) + newFeatures + code.slice(insertPos);
}

fs.writeFileSync('src/pages/LandingPage.tsx', code);
