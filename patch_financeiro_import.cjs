const fs = require('fs');
let code = fs.readFileSync('src/pages/Financeiro.tsx', 'utf8');

if (!code.includes("import { gerarPDF }")) {
  code = "import { gerarPDF } from '../utils/pdfGenerator';\n" + code;
}

code = code.replace(
  'const { financeiro: transacoes, membros, loading } = useData();',
  'const { financeiro: transacoes, membros, casa, loading } = useData();'
);

fs.writeFileSync('src/pages/Financeiro.tsx', code);
