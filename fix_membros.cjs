const fs = require('fs');
let code = fs.readFileSync('src/pages/Membros.tsx', 'utf8');

const regex = /\s*const PLAN_LIMITS = \{\s*'price_1UEag7BejuJh61udGrM5w6oo': 25, \/\/ Essencial\s*'price_1UEahkBejuJh61udF758QtDQ': 70, \/\/ Comunidade\s*'price_1UEaiWBejuJh61uduZGizvCM': Infinity, \/\/ Federação\s*'price_1UEajLBejuJh61udOqNGOrVQ': Infinity, \/\/ Anual\s*\};\s*/;

code = code.replace(regex, ' ');
code = "const PLAN_LIMITS = {\n  'price_1UEag7BejuJh61udGrM5w6oo': 25,\n  'price_1UEahkBejuJh61udF758QtDQ': 70,\n  'price_1UEaiWBejuJh61uduZGizvCM': Infinity,\n  'price_1UEajLBejuJh61udOqNGOrVQ': Infinity,\n};\n" + code;

fs.writeFileSync('src/pages/Membros.tsx', code);
