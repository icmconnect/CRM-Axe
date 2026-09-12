const fs = require('fs');
let code = fs.readFileSync('src/pages/Financeiro.tsx', 'utf8');

// Substitute createPDFBlob, handleOpenPDF, handleSharePDF with gerarPDFFinanceiro
const regex = /const createPDFBlob = async[\s\S]*?alert\('O compartilhamento nativo não é suportado neste dispositivo\.'\);\n    \}\n  \};/;

const newLogic = `
  const gerarPDFFinanceiro = async (action: 'download' | 'share' = 'download') => {
    try {
      const mesNome = format(mesSelecionado, 'MMMM yyyy', { locale: ptBR });
      
      const tableData = transacoesDoMes.map(t => [
        new Date(t.data).toLocaleDateString('pt-BR'),
        t.descricao || '-',
        t.categoria || '-',
        t.tipo || '-',
        \`R$ \${(Number(t.valor) || 0).toFixed(2)}\`
      ]);

      await gerarPDF({
        title: \`Relatório Financeiro - \${mesNome.toUpperCase()}\`,
        subtitle: \`Data de Geração: \${new Date().toLocaleDateString('pt-BR')}\`,
        summaryFields: [
          { label: \`Total Receitas (\${mesNome})\`, value: \`R$ \${(Number(totalReceitas) || 0).toFixed(2)}\` },
          { label: \`Total Despesas (\${mesNome})\`, value: \`R$ \${(Number(totalDespesas) || 0).toFixed(2)}\` },
          { label: \`Saldo do Mês\`, value: \`R$ \${(Number(saldo) || 0).toFixed(2)}\` },
          { label: \`Saldo Geral Acumulado\`, value: \`R$ \${(Number(totalGeralAcumulado) || 0).toFixed(2)}\` },
          { label: \`A Receber (Inadimplentes)\`, value: \`R$ \${(Number(aReceber) || 0).toFixed(2)}\` },
        ],
        tables: [{
          headers: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
          body: tableData
        }],
        action,
        fileName: \`relatorio-financeiro-\${mesNome}.pdf\`,
        shareText: \`*Relatório Financeiro - \${mesNome.toUpperCase()}*\\nSaldo Mês: R$ \${(Number(saldo) || 0).toFixed(2)}\`,
        logoUrl: casa?.logoUrl
      });
    } catch (error) {
      console.error("Erro ao gerar PDF Financeiro:", error);
      alert("Ocorreu um erro ao gerar o relatório. Tente novamente.");
    }
  };
`;

code = code.replace(regex, newLogic);

code = code.replace(/onClick=\{handleOpenPDF\}/g, "onClick={() => gerarPDFFinanceiro('download')}");
code = code.replace(/onClick=\{handleSharePDF\}/g, "onClick={() => gerarPDFFinanceiro('share')}");

// Also add a download button for Inadimplentes instead of 'Relatório de Inadimplentes' being alone, or make it look right. 
// User requested "Adicione um botão 'Relatório de Inadimplentes' na página Financeiro." which I already did.

fs.writeFileSync('src/pages/Financeiro.tsx', code);
