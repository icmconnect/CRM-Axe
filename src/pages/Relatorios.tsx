import { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Financeiro as IFinanceiro } from '../types';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Download, PieChart, List, Share2, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Relatorios() {
  const { financeiro, loading } = useData();

  // Estados para o filtro de data (padrão: mês atual)
  const [dataInicial, setDataInicial] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFinal, setDataFinal] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Filtra os dados financeiros com base no período selecionado
  const financeiroFiltrado = useMemo(() => {
    if (!dataInicial || !dataFinal) return financeiro;
    
    try {
      const start = parseISO(dataInicial);
      const end = parseISO(dataFinal);
      // Ajusta o final para o final do dia para incluir lançamentos feitos no último dia
      end.setHours(23, 59, 59, 999);

      return financeiro.filter(f => {
        if (!f.data) return false;
        const dataLancamento = new Date(f.data);
        return isWithinInterval(dataLancamento, { start, end });
      });
    } catch (e) {
      console.error("Erro ao filtrar datas:", e);
      return financeiro;
    }
  }, [financeiro, dataInicial, dataFinal]);

  const gerarPDFSintetico = async (action: 'download' | 'share' = 'download') => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Relatório Sintético - Portal dos Sacerdotes', 14, 22);
      
      const entradas = financeiroFiltrado.filter(f => f.tipo === 'Entrada').reduce((acc, curr) => acc + curr.valor, 0);
      const saidas = financeiroFiltrado.filter(f => f.tipo === 'Saída').reduce((acc, curr) => acc + curr.valor, 0);
      const saldo = entradas - saidas;
      const horasDoadas = financeiroFiltrado.reduce((acc, curr) => acc + (Number(curr.horas_trabalhadas) || 0), 0);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Período: ${format(parseISO(dataInicial), 'dd/MM/yyyy')} a ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`, 14, 30);
      doc.text(`Data de Geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36);
      
      autoTable(doc, {
        startY: 42,
        head: [['Resumo', 'Valor']],
        body: [
          ['Total de Entradas', `R$ ${entradas.toFixed(2)}`],
          ['Total de Saídas', `R$ ${saidas.toFixed(2)}`],
          ['Saldo Líquido', `R$ ${saldo.toFixed(2)}`],
          ['Horas Doadas', `${horasDoadas}h`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [217, 119, 6] }
      });

      if (action === 'download') {
        doc.save('relatorio-sintetico.pdf');
      } else {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], 'relatorio-sintetico.pdf', { type: 'application/pdf' });
        
        const shareData = {
          title: 'Relatório Sintético',
          text: `*Relatório Sintético - Portal dos Sacerdotes*\nData: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n\nEntradas: R$ ${entradas.toFixed(2)}\nSaídas: R$ ${saidas.toFixed(2)}\nSaldo: R$ ${saldo.toFixed(2)}`,
        };

        if (navigator.share) {
          try {
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({ ...shareData, files: [file] });
            } else {
              await navigator.share(shareData);
            }
          } catch (err) {
            console.error('Erro ao compartilhar sintético:', err);
            window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text)}`, '_blank');
          }
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text)}`, '_blank');
        }
      }
    } catch (error) {
      console.error("Erro ao gerar PDF Sintético:", error);
      alert("Ocorreu um erro ao gerar o relatório. Tente novamente.");
    }
  };

  const gerarPDFAnalitico = async (action: 'download' | 'share' = 'download') => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Relatório Analítico - Portal dos Sacerdotes', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Período: ${format(parseISO(dataInicial), 'dd/MM/yyyy')} a ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`, 14, 30);
      doc.text(`Data de Geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 36);

      const sortedFin = [...financeiroFiltrado].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      const tableData = sortedFin.map(f => {
        let dataFormatada = 'Data Inválida';
        try {
          if (f.data) {
            dataFormatada = format(new Date(f.data), 'dd/MM/yyyy');
          }
        } catch (e) {
          console.warn('Data inválida para o registro:', f);
        }
        return [
          dataFormatada,
          f.tipo,
          f.categoria,
          f.descricao,
          `R$ ${f.valor.toFixed(2)}`,
          f.horas_trabalhadas ? `${f.horas_trabalhadas}h` : '-'
        ];
      });

      autoTable(doc, {
        startY: 42,
        head: [['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Horas']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [217, 119, 6] }
      });

      if (action === 'download') {
        doc.save('relatorio-analitico.pdf');
      } else {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], 'relatorio-analitico.pdf', { type: 'application/pdf' });
        
        const shareData = {
          title: 'Relatório Analítico',
          text: `*Relatório Analítico - Portal dos Sacerdotes*\nData: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n\nForam registrados ${sortedFin.length} lançamentos. Baixe o PDF no sistema para ver os detalhes.`,
        };

        if (navigator.share) {
          try {
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({ ...shareData, files: [file] });
            } else {
              await navigator.share(shareData);
            }
          } catch (err) {
            console.error('Erro ao compartilhar analítico:', err);
            window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text)}`, '_blank');
          }
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text)}`, '_blank');
        }
      }
    } catch (error) {
      console.error("Erro ao gerar PDF Analítico:", error);
      alert("Ocorreu um erro ao gerar o relatório. Tente novamente.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <FileText className="mr-3 text-[#D97706] dark:text-[#FBBF24]" size={28} />
          Relatórios
          {loading && <span className="ml-3 text-sm font-normal text-slate-400 dark:text-slate-500 animate-pulse">Carregando...</span>}
        </h2>
      </div>

      {/* Filtro de Período */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center mb-4">
          <Calendar className="text-[#D97706] dark:text-[#FBBF24] mr-2" size={20} />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Filtro de Período</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Data Inicial</label>
            <input 
              type="date" 
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Data Final</label>
            <input 
              type="date" 
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#D97706] dark:focus:ring-[#FBBF24] outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
          Os relatórios abaixo serão gerados com base no período selecionado acima.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Relatório Sintético */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-colors">
          <div>
            <div className="w-12 h-12 bg-[#FFF9E6] dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-[#D97706] dark:text-[#FBBF24] mb-4">
              <PieChart size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Relatório Sintético</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Visão geral consolidada das finanças. Inclui totais de entradas, saídas e saldo líquido do período. Ideal para acompanhamento rápido.
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => gerarPDFSintetico('download')}
              disabled={loading}
              className="flex-1 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <Download size={18} className="mr-2" /> PDF
            </button>
            <button 
              onClick={() => gerarPDFSintetico('share')}
              disabled={loading}
              className="flex-1 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <Share2 size={18} className="mr-2" /> Compartilhar
            </button>
          </div>
        </div>

        {/* Relatório Analítico */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-colors">
          <div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <List size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Relatório Analítico</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Listagem detalhada de todas as transações financeiras. Inclui datas, categorias, descrições e valores individuais de cada lançamento.
            </p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => gerarPDFAnalitico('download')}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] dark:from-[#D97706] dark:to-[#B45309] hover:from-[#D97706] hover:to-[#B45309] dark:hover:from-[#B45309] dark:hover:to-[#92400E] text-white px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center disabled:opacity-50 shadow-md"
            >
              <Download size={18} className="mr-2" /> PDF
            </button>
            <button 
              onClick={() => gerarPDFAnalitico('share')}
              disabled={loading}
              className="flex-1 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center disabled:opacity-50 shadow-md"
            >
              <Share2 size={18} className="mr-2" /> Compartilhar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
