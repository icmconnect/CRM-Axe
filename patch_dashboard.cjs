const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(/import jsPDF from 'jspdf';\nimport autoTable from 'jspdf-autotable';/, "import { gerarPDF } from '../utils/pdfGenerator';");

const sintRe = /const gerarPDFSintetico = async[\s\S]*?\} catch \(error\) \{[\s\S]*?alert\("Ocorreu um erro ao gerar o relatório. Tente novamente."\);\n    \}\n  \};/;

code = code.replace(sintRe, `const gerarPDFSintetico = async (action: 'download' | 'share' = 'download') => {
    try {
      const entradas = financeiroFiltrado.filter(f => f.tipo === 'Entrada').reduce((acc, curr) => acc + curr.valor, 0);
      const saidas = financeiroFiltrado.filter(f => f.tipo === 'Saída').reduce((acc, curr) => acc + curr.valor, 0);
      const saldo = entradas - saidas;
      const horasDoadas = financeiroFiltrado.reduce((acc, curr) => acc + (Number(curr.horas_trabalhadas) || 0), 0);

      await gerarPDF({
        title: 'Relatório Sintético',
        subtitle: \`Período: \${format(startOfMonth(new Date()), 'dd/MM/yyyy')} a \${format(endOfMonth(new Date()), 'dd/MM/yyyy')}\`,
        tables: [{
          headers: [['Resumo', 'Valor']],
          body: [
            ['Total de Entradas', \`R$ \${entradas.toFixed(2)}\`],
            ['Total de Saídas', \`R$ \${saidas.toFixed(2)}\`],
            ['Saldo Líquido', \`R$ \${saldo.toFixed(2)}\`],
            ['Horas Doadas', \`\${horasDoadas}h\`],
          ]
        }],
        action,
        fileName: 'dashboard-sintetico.pdf',
        shareText: \`*Relatório Dashboard - Ase Connect*\\nEntradas: R$ \${entradas.toFixed(2)}\\nSaídas: R$ \${saidas.toFixed(2)}\\nSaldo: R$ \${saldo.toFixed(2)}\`,
        logoUrl: casa?.logoUrl
      });
    } catch (error) {
      console.error("Erro ao gerar PDF Sintético:", error);
      alert("Ocorreu um erro ao gerar o relatório. Tente novamente.");
    }
  };`);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
