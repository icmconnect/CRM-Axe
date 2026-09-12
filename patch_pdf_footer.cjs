const fs = require('fs');
let code = fs.readFileSync('src/utils/pdfGenerator.ts', 'utf8');

const regex = /doc\.text\('Gerado por ASE CONNECT - aseconnect.com.br', 105, 290, \{ align: 'center' \}\);/;

code = code.replace(regex, `doc.text('Gerado por ASE CONNECT - aseconnect.com.br', 105, 290, { align: 'center' });\n    doc.text(\`Página \${i} de \${pageCount}\`, 105, 294, { align: 'center' });`);

fs.writeFileSync('src/utils/pdfGenerator.ts', code);
