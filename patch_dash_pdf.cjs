const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Replace the WHOLE gerarPDFSintetico block
const sintRe = /const gerarPDFSintetico = async[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n\s*\} else \{\n\s*window.open[\s\S]*?\}\n\s*\}\n\s*\};/;
// Let's use a safer regex or just string indexOf

const startSintetico = code.indexOf("const gerarPDFSintetico = async (action: 'download' | 'share' = 'download') => {");
let endSintetico = startSintetico;
let braces = 0;
let started = false;
for (let i = startSintetico; i < code.length; i++) {
  if (code[i] === '{') {
    braces++;
    started = true;
  } else if (code[i] === '}') {
    braces--;
  }
  if (started && braces === 0) {
    endSintetico = i + 1;
    // skip trailing semicolon if present
    if (code[endSintetico] === ';') {
      endSintetico++;
    }
    break;
  }
}

const newPdfs = `
  const gerarPDFSintetico = async (action: 'download' | 'share' = 'download') => {
    try {
      await gerarPDF({
        title: 'Relatório Sintético',
        subtitle: \`Período: \${format(startOfMonth(mesSelecionado), 'dd/MM/yyyy')} a \${format(endOfMonth(mesSelecionado), 'dd/MM/yyyy')}\`,
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
        logoUrl: casaInfo?.logoUrl || casa?.logoUrl
      });
    } catch (error) {
      console.error("Erro ao gerar PDF Sintético:", error);
      alert("Ocorreu um erro ao gerar o relatório. Tente novamente.");
    }
  };

  const gerarPDFAnalitico = async (action: 'download' | 'share' = 'download') => {
    try {
      const sortedFin = [...financeiro].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      
      const tableData = sortedFin.map(f => {
        let dataFormatada = 'Data Inválida';
        try {
          if (f.data) dataFormatada = format(new Date(f.data), 'dd/MM/yyyy');
        } catch (e) {}
        return [
          dataFormatada,
          f.tipo,
          f.descricao || '-',
          f.categoria || '-',
          \`R$ \${f.valor.toFixed(2)}\`
        ];
      });

      await gerarPDF({
        title: 'Relatório Analítico',
        subtitle: \`Período: \${format(startOfMonth(mesSelecionado), 'dd/MM/yyyy')} a \${format(endOfMonth(mesSelecionado), 'dd/MM/yyyy')}\`,
        tables: [{
          headers: [['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor']],
          body: tableData
        }],
        action,
        fileName: 'dashboard-analitico.pdf',
        shareText: \`*Relatório Analítico - Ase Connect*\\nPeríodo: \${format(startOfMonth(mesSelecionado), 'dd/MM/yyyy')} a \${format(endOfMonth(mesSelecionado), 'dd/MM/yyyy')}\`,
        logoUrl: casaInfo?.logoUrl || casa?.logoUrl
      });
    } catch (error) {
      console.error("Erro ao gerar PDF Analítico:", error);
      alert("Ocorreu um erro ao gerar o relatório. Tente novamente.");
    }
  };
`;

if (startSintetico !== -1) {
  code = code.slice(0, startSintetico) + newPdfs + code.slice(endSintetico);
}

// Remove the `alert('Funcionalidade de PDF Analítico em breve no Dashboard.');`
code = code.replace(/onClick=\{\(\) => alert\('Funcionalidade de PDF Analítico em breve no Dashboard\.'\)\}/, "onClick={() => gerarPDFAnalitico('download')}");
code = code.replace(/onClick=\{\(\) => alert\('Em breve'\)\}/, "onClick={() => gerarPDFAnalitico('share')}");

// Make sure `gerarPDF` is imported
if (!code.includes("import { gerarPDF }")) {
  code = code.replace(/import jsPDF from 'jspdf';\nimport autoTable from 'jspdf-autotable';/, "import { gerarPDF } from '../utils/pdfGenerator';");
}

fs.writeFileSync('src/pages/Dashboard.tsx', code);
