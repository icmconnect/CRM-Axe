const fs = require('fs');
let code = fs.readFileSync('src/pages/Relatorios.tsx', 'utf8');

code = code.replace(
  'const { financeiro, loading } = useData();',
  'const { financeiro, casa, loading } = useData();'
);

fs.writeFileSync('src/pages/Relatorios.tsx', code);
