const fs = require('fs');
let code = fs.readFileSync('src/pages/Financeiro.tsx', 'utf8');

const inadimplentesLogic = `
  const gerarPDFInadimplentes = async () => {
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const membrosEmAtraso = membros.filter(membro => {
        if (membro.status !== 'Ativo') return false; // Ignore inactive members
        // Check if there is an 'Entrada' (mensalidade) this month
        const hasPaid = financeiro.some(f => 
          f.id_membro === membro.id && 
          f.tipo === 'Entrada' &&
          new Date(f.data).getMonth() === currentMonth &&
          new Date(f.data).getFullYear() === currentYear
        );
        return !hasPaid;
      });

      const tableData = membrosEmAtraso.map(m => [
        m.nome,
        m.telefone || '-',
        \`R$ \${(m.mensalidade || 0).toFixed(2)}\`,
        \`R$ \${(m.mensalidade || 0).toFixed(2)}\` // Assuming 1 month due
      ]);

      const totalDevido = membrosEmAtraso.reduce((acc, curr) => acc + (curr.mensalidade || 0), 0);

      await gerarPDF({
        title: 'Relatório de Inadimplência',
        subtitle: \`Mês/Ano: \${currentMonth + 1}/\${currentYear}\`,
        tables: [{
          headers: [['Nome', 'Telefone', 'Valor Mensalidade', 'Total Devido']],
          body: tableData
        }],
        summaryFields: [
          { label: 'Total de Membros em Atraso', value: membrosEmAtraso.length.toString() },
          { label: 'Valor Total a Receber', value: \`R$ \${totalDevido.toFixed(2)}\` }
        ],
        action: 'download',
        fileName: 'relatorio-inadimplentes.pdf',
        logoUrl: casa?.logoUrl
      });
    } catch (error) {
      console.error("Erro ao gerar PDF Inadimplentes:", error);
      alert("Ocorreu um erro ao gerar o relatório.");
    }
  };
`;

const insertPos = code.indexOf('const gerarReciboPDF');
code = code.slice(0, insertPos) + inadimplentesLogic + '\n  ' + code.slice(insertPos);

const btnHtml = `
          <button 
            onClick={gerarPDFInadimplentes}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl font-medium transition-colors border border-red-200 shadow-sm"
          >
            <FileText size={20} />
            <span className="hidden sm:inline">Relatório de Inadimplentes</span>
          </button>
`;

code = code.replace(/<button\s*onClick=\{\(\) => setIsModalOpen\(true\)\}\s*className="flex items-center gap-2 bg-slate-900/, btnHtml + '$&');

fs.writeFileSync('src/pages/Financeiro.tsx', code);
