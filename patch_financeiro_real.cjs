const fs = require('fs');
let code = fs.readFileSync('src/pages/Financeiro.tsx', 'utf8');

// Move the closing brace of Financeiro to the very end of the file
const findLastBraceRegex = /\n\}\n  const gerarPDFInadimplentes = async \(\) => \{/;

if (findLastBraceRegex.test(code)) {
    code = code.replace(findLastBraceRegex, '\n  const gerarPDFInadimplentes = async () => {');
    code += '\n}\n';
    fs.writeFileSync('src/pages/Financeiro.tsx', code);
    console.log('Fixed closing brace');
} else {
    console.log('Could not find the pattern');
}

