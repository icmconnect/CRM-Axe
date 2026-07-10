/**
 * Gerador de PDFs dinâmico e centralizado com estilo unificado (Amber)
 */

export interface PDFTableConfig {
  title?: string;
  headers: string[][];
  body: any[][];
}

export interface PDFSummaryField {
  label: string;
  value: string;
}

export interface PDFGeneratorConfig {
  title: string;
  subtitle?: string;
  summaryFields?: PDFSummaryField[];
  tables?: PDFTableConfig[];
  action?: 'download' | 'share';
  fileName: string;
  shareTitle?: string;
  shareText?: string;
}

/**
 * Compartilha o arquivo PDF gerado ou faz fallback para WhatsApp
 */
export async function compartilharPDF(
  blob: Blob,
  fileName: string,
  shareTitle: string,
  shareText: string
): Promise<void> {
  const file = new File([blob], fileName, { type: 'application/pdf' });

  const shareData = {
    title: shareTitle,
    text: shareText,
  };

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ ...shareData, files: [file] });
        return;
      } else {
        await navigator.share(shareData);
        return;
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao compartilhar via Web Share:', err);
      } else {
        return; // Cancelado pelo usuário
      }
    }
  }

  // Fallback para WhatsApp
  const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}`)}`;
  window.open(url, '_blank');
}

/**
 * Gera um PDF unificado e estilizado
 */
export async function gerarPDF(config: PDFGeneratorConfig): Promise<any> {
  // Imports dinâmicos para evitar carregamento estático e otimizar bundle size
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  
  // Faixa/Linha decorativa com a cor Amber (#D97706 / RGB 217, 119, 6)
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 0, 210, 8, 'F');
  
  // Título do documento
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(config.title, 14, 25);
  
  // Data e hora de geração
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 32);
  
  let currentY = 40;
  
  if (config.subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.text(config.subtitle, 14, currentY);
    currentY += 8;
  }
  
  // Dados de resumo (Labels e valores estruturados)
  if (config.summaryFields && config.summaryFields.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    for (const field of config.summaryFields) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${field.label}: `, 14, currentY);
      const labelWidth = doc.getTextWidth(`${field.label}: `);
      doc.setFont('helvetica', 'normal');
      doc.text(field.value, 14 + labelWidth, currentY);
      currentY += 6;
    }
    currentY += 4;
  }
  
  // Adiciona as tabelas dinamicamente
  if (config.tables && config.tables.length > 0) {
    for (const table of config.tables) {
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }

      if (table.title) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(table.title, 14, currentY);
        currentY += 6;
      }
      
      autoTable(doc, {
        startY: currentY,
        head: table.headers,
        body: table.body,
        theme: 'grid',
        headStyles: { 
          fillColor: [217, 119, 6], // Amber-600
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [51, 65, 85]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate-50
        },
        margin: { left: 14, right: 14 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 12;
    }
  }
  
  const fileName = config.fileName;
  
  if (config.action === 'download') {
    doc.save(fileName);
  } else {
    const pdfBlob = doc.output('blob');
    await compartilharPDF(
      pdfBlob,
      fileName,
      config.shareTitle || config.title,
      config.shareText || ''
    );
  }

  return doc;
}
