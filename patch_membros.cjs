const fs = require('fs');
let code = fs.readFileSync('src/pages/Membros.tsx', 'utf8');

code = code.replace(
  'const { membros, financeiro, loading } = useData();',
  'const { membros, financeiro, casa, loading } = useData();'
);

fs.writeFileSync('src/pages/Membros.tsx', code);
