const fs = require('fs');
let code = fs.readFileSync('src/utils/pdfGenerator.ts', 'utf8');

const regex = /\/\/ Renderiza a Logo \(Personalizada ou Padrão\)[\s\S]*?\} else \{[\s\S]*?currentY = 32;\n  \}/;

const logoLogic = `
  // Renderiza a Logo (Personalizada ou Padrão)
  const logoTargetUrl = config.logoUrl || '/assets/images/logo-nova.png';
  const dataUrl = await loadImgDataUrl(logoTargetUrl);
  
  if (dataUrl) {
    // Calculando tamanho para nao esticar
    // Geralmente logo-nova.png é retangular, mas limitamos a altura e largura
    doc.addImage(dataUrl, 'PNG', 14, 12, 35, 15, undefined, 'FAST');
    currentY = 35;
  } else {
    doc.setFontSize(16);
    doc.setTextColor(217, 119, 6);
    doc.text('ASE CONNECT', 14, 20);
    currentY = 32;
  }
`;

code = code.replace(regex, logoLogic);
fs.writeFileSync('src/utils/pdfGenerator.ts', code);
