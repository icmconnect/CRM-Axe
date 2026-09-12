const fs = require('fs');
let code = fs.readFileSync('src/pages/Financeiro.tsx', 'utf8');

// 1. Import gerarPDF
if (!code.includes("import { gerarPDF }")) {
  code = "import { gerarPDF } from '../utils/pdfGenerator';\n" + code;
}

// 2. add casa to useData
code = code.replace(
  'const { financeiro: transacoes, membros, loading } = useData();',
  'const { financeiro: transacoes, membros, casa, loading } = useData();'
);

// 3. Move gerarPDFInadimplentes inside Financeiro
const funcStart = code.indexOf('const gerarPDFInadimplentes = async () => {');
if (funcStart !== -1) {
  // Extract function string
  const afterFunc = code.slice(funcStart);
  // Remove it from the end
  code = code.slice(0, funcStart).trim();
  if (code.endsWith('}')) {
    code = code.slice(0, -1) + '\n' + afterFunc + '\n}';
  }
}

// But wait, the function is currently OUTSIDE the component. It should have been inside. Let's write a smarter regex or just replace the end of file.
// The end of the file is currently:
/*
  );
}
  const gerarPDFInadimplentes = async () => {
    ...
  };
*/
// Let's manually do it if it matches.
