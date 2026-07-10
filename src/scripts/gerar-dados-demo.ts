import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Função para gerar dados de demonstração (membros, financeiro e eventos)
 * associados ao ambiente='teste' e a uma id_casa específica.
 */
export async function gerarDadosDemo(id_casa: string): Promise<{ membros: number; transacoes: number; eventos: number }> {
  console.log(`[DEMO_GEN] Iniciando geração de dados demo para a casa "${id_casa}"...`);
  
  let membrosCriados = 0;
  let transacoesCriadas = 0;
  let eventosCriados = 0;
  
  // Guardaremos os IDs dos membros gerados para vincular adequadamente às transações
  const membrosIds: string[] = [];
  const membrosNomes: string[] = [];

  // 1. Criar Membros Demo (5)
  console.log('[DEMO_GEN] Criando novos membros de demonstração...');
  const nomesDemo = [
    'Filho de Santo Demo 1',
    'Filho de Santo Demo 2',
    'Filho de Santo Demo 3',
    'Filho de Santo Demo 4',
    'Filho de Santo Demo 5'
  ];

  for (let i = 0; i < nomesDemo.length; i++) {
    try {
      const valorContribuicao = Math.floor(Math.random() * (200 - 50 + 1)) + 50; // entre 50 e 200
      const ref = await addDoc(collection(db, 'membros'), {
        nome: nomesDemo[i],
        email: `demo${i + 1}@teste.com`,
        whatsapp: `(21) 99999-000${i + 1}`,
        nascimento: `19${80 + i}-05-15`,
        profissao: 'Estudante Demo',
        escolaridade: 'Superior Completo',
        contribuicao_sugerida: valorContribuicao,
        status: 'Ativo',
        id_casa,
        ambiente: 'teste'
      });
      membrosIds.push(ref.id);
      membrosNomes.push(nomesDemo[i]);
      membrosCriados++;
      console.log(`[DEMO_GEN] Membro demo "${nomesDemo[i]}" criado com ID: ${ref.id}`);
    } catch (err) {
      console.error('[DEMO_GEN] Falha ao criar membro demo:', err);
    }
  }

  // 2. Criar Eventos Demo (2)
  console.log('[DEMO_GEN] Criando eventos de demonstração...');
  const eventosDemo = [
    { nome: 'Festa de Iemanjá Demo', meta: 1500 },
    { nome: 'Obrigação de Xangô Demo', meta: 2000 }
  ];
  const eventosIds: string[] = [];

  for (const ev of eventosDemo) {
    try {
      const dataFutura = new Date();
      dataFutura.setDate(dataFutura.getDate() + 30 + Math.floor(Math.random() * 15));
      const ref = await addDoc(collection(db, 'eventos'), {
        nome: ev.nome,
        meta_financeira: ev.meta,
        data: dataFutura.toISOString().split('T')[0],
        status: 'Aberto',
        id_casa,
        ambiente: 'teste'
      });
      eventosIds.push(ref.id);
      eventosCriados++;
      console.log(`[DEMO_GEN] Evento demo "${ev.nome}" criado com ID: ${ref.id}`);
    } catch (err) {
      console.error('[DEMO_GEN] Falha ao criar evento demo:', err);
    }
  }

  // 3. Criar Transações Financeiras Demo (10)
  console.log('[DEMO_GEN] Criando transações financeiras de demonstração...');
  const categoriasEntradas = ['Mensalidade', 'Doação', 'Arrecadação Festa'];
  const categoriasSaidas = ['Manutenção', 'Materiais', 'Limpeza', 'Aluguel'];

  for (let i = 0; i < 10; i++) {
    try {
      const isEntrada = i % 2 === 0; // Alternar entre entradas e saídas
      const tipo = isEntrada ? 'Entrada' : 'Saída';
      const categoria = isEntrada 
        ? categoriasEntradas[Math.floor(Math.random() * categoriasEntradas.length)]
        : categoriasSaidas[Math.floor(Math.random() * categoriasSaidas.length)];
      
      const valor = Math.floor(Math.random() * (500 - 20 + 1)) + 20; // entre 20 e 500
      
      // Data aleatória nos últimos 30 dias
      const dataDoc = new Date();
      dataDoc.setDate(dataDoc.getDate() - Math.floor(Math.random() * 30));

      const transacaoData: any = {
        tipo,
        categoria,
        valor,
        data: dataDoc.toISOString().split('T')[0],
        descricao: `Lançamento Demo #${i + 1} (${categoria})`,
        id_casa,
        ambiente: 'teste',
        modificado_por_email: 'gustavomacedo.consultor@gmail.com'
      };

      // Se for entrada e temos membros cadastrados, vincular a um membro
      if (isEntrada && membrosIds.length > 0 && Math.random() > 0.3) {
        const idx = Math.floor(Math.random() * membrosIds.length);
        transacaoData.id_membro = membrosIds[idx];
        transacaoData.doador_nome = membrosNomes[idx];
        transacaoData.descricao = `Mensalidade paga por ${membrosNomes[idx]} (Demo)`;
      }

      // Se houver eventos criados, vincular a transação opcionalmente ao evento
      if (eventosIds.length > 0 && Math.random() > 0.5) {
        transacaoData.id_evento = eventosIds[Math.floor(Math.random() * eventosIds.length)];
      }

      const ref = await addDoc(collection(db, 'financeiro'), transacaoData);
      transacoesCriadas++;
      console.log(`[DEMO_GEN] Transação demo #${i + 1} (${tipo} - R$ ${valor}) criada com ID: ${ref.id}`);
    } catch (err) {
      console.error('[DEMO_GEN] Falha ao criar transação demo:', err);
    }
  }

  console.log('[DEMO_GEN] Processo de geração de dados de teste finalizado com sucesso.');
  return {
    membros: membrosCriados,
    transacoes: transacoesCriadas,
    eventos: eventosCriados
  };
}
