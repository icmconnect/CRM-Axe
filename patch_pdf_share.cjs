const fs = require('fs');
let code = fs.readFileSync('src/utils/pdfGenerator.ts', 'utf8');

const shareRegex = /  \/\/ Fallback para WhatsApp[\s\S]*?window\.open\(url, '_blank'\);\n\}/;

code = code.replace(shareRegex, `  // Fallback para download direto
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}`);

fs.writeFileSync('src/utils/pdfGenerator.ts', code);
