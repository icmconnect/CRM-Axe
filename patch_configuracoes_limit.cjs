const fs = require('fs');
let code = fs.readFileSync('src/pages/Configuracoes.tsx', 'utf8');

const planLogic = `
const PLAN_LIMITS_USERS = {
  'price_1UEag7BejuJh61udGrM5w6oo': 2, // Essencial
  'price_1UEahkBejuJh61udF758QtDQ': 4, // Comunidade
  'price_1UEaiWBejuJh61uduZGizvCM': 5, // Federação
  'price_1UEajLBejuJh61udOqNGOrVQ': 5, // Anual
};
`;

code = code.replace("export default function Configuracoes() {", planLogic + "\nexport default function Configuracoes() {");

const inviteRe = /(const handleSendInvite = async \(e: React\.FormEvent\) => \{\n\s*e\.preventDefault\(\);\n\s*if \(\!inviteEmail \|\| \!casa\?.id\) return;\n)/;
code = code.replace(inviteRe, `$1
    // Check user limits
    try {
      const limit = PLAN_LIMITS_USERS[casa?.plano as keyof typeof PLAN_LIMITS_USERS] || 2;
      
      const qUsers = query(collection(db, 'users'), where('id_casa', '==', casa.id));
      const snapUsers = await getDocs(qUsers);
      
      const qConvites = query(collection(db, 'convites'), where('id_casa', '==', casa.id), where('status', '==', 'pendente'));
      const snapConvites = await getDocs(qConvites);
      
      const totalUsers = snapUsers.size + snapConvites.size;
      
      if (totalUsers >= limit) {
        alert(\`Seu plano atual permite até \${limit} usuários. Por favor, faça o upgrade para adicionar mais diretores.\`);
        return;
      }
    } catch (e) {
      console.error(e);
    }
`);

fs.writeFileSync('src/pages/Configuracoes.tsx', code);
