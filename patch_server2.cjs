const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const casasRef = db\.collection\('casas_axe'\);/, "const casasRef = admin.firestore().collection('casas_axe');");

fs.writeFileSync('server.ts', code);
