const fs = require('fs');
let code = fs.readFileSync('src/pages/Membros.tsx', 'utf8');

// Insert a function to check plan limits
const importPos = code.lastIndexOf("import");
const endOfImports = code.indexOf('\n', importPos) + 1;

const planLogic = `
const PLAN_LIMITS = {
  'price_1UEag7BejuJh61udGrM5w6oo': 25, // Essencial
  'price_1UEahkBejuJh61udF758QtDQ': 70, // Comunidade
  'price_1UEaiWBejuJh61uduZGizvCM': Infinity, // Federação
  'price_1UEajLBejuJh61udOqNGOrVQ': Infinity, // Anual
};
`;

code = code.slice(0, endOfImports) + planLogic + code.slice(endOfImports);

// Inside check before adding member
const addMemberRe = /(const handleSubmit = async \(e: React\.FormEvent\) => \{\n\s*e\.preventDefault\(\);\n\s*if \(\!casa\?.id\) return;\n)/;
code = code.replace(addMemberRe, `$1
    const limit = PLAN_LIMITS[casa?.plano as keyof typeof PLAN_LIMITS] || 25; // Default trial/essencial
    if (membros.length >= limit && !editingMembro) {
      alert(\`Seu plano atual permite até \${limit} membros. Por favor, faça o upgrade do seu plano para cadastrar mais membros.\`);
      return;
    }
`);

fs.writeFileSync('src/pages/Membros.tsx', code);
