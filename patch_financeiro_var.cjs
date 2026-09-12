const fs = require('fs');
let code = fs.readFileSync('src/pages/Financeiro.tsx', 'utf8');

code = code.replace(/financeiro\.some/g, 'transacoes.some');

fs.writeFileSync('src/pages/Financeiro.tsx', code);
