const fs = require('fs');
let code = fs.readFileSync('src/pages/Membros.tsx', 'utf8');

// Insert the new PDF generation function
const funcHtml = `
  const gerarPDFMembros = async () => {
    try {
      const tableData = membros.map(m => [
        m.nome,
        m.telefone || '-',
        m.profissao || '-'
      ]);

      await gerarPDF({
        title: 'Relatório de Membros',
        subtitle: \`Total de Membros: \${membros.length}\`,
        tables: [{
          headers: [['Nome', 'Telefone', 'Profissão']],
          body: tableData
        }],
        action: 'download',
        fileName: 'relatorio-membros.pdf',
        logoUrl: casa?.logoUrl
      });
    } catch (error) {
      console.error("Erro ao gerar PDF de Membros:", error);
      alert("Ocorreu um erro ao gerar o relatório.");
    }
  };
`;

code = code.replace("export default function Membros() {\n  const { membros", "import { gerarPDF } from '../utils/pdfGenerator';\nexport default function Membros() {\n  const { membros");

const addPos = code.indexOf('const isDelinquent = (membroId: string) => {');
code = code.slice(0, addPos) + funcHtml + code.slice(addPos);

// Add the button 'Relatório de Membros'
const btnHtml = `
          <button 
            onClick={gerarPDFMembros}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium transition-colors border border-slate-200 shadow-sm"
          >
            <Download size={20} />
            <span className="hidden sm:inline">Relatório de Membros</span>
          </button>
`;

code = code.replace(/<button\s*onClick=\{\(\) => setIsNewModalOpen\(true\)\}\s*className="flex items-center gap-2 bg-slate-900/, btnHtml + '$&');

fs.writeFileSync('src/pages/Membros.tsx', code);
