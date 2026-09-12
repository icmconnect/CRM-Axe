const fs = require('fs');
let code = fs.readFileSync('src/utils/pdfGenerator.ts', 'utf8');

// replace dynamic imports with static imports
code = "import jsPDF from 'jspdf';\nimport autoTable from 'jspdf-autotable';\n" + code;

const dynamicRegex = /  \/\/ Imports dinâmicos para evitar carregamento estático e otimizar bundle size\n  const \{ default: jsPDF \} = await import\('jspdf'\);\n  const \{ default: autoTable \} = await import\('jspdf-autotable'\);\n/;

code = code.replace(dynamicRegex, '');

fs.writeFileSync('src/utils/pdfGenerator.ts', code);
