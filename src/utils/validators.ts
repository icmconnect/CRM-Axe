/**
 * Validadores de dados para o Portal dos Sacerdotes
 */

export interface ValidacaoResultado {
  valido: boolean;
  erros: string[];
}

/**
 * Valida um lançamento financeiro
 */
export function validarLancamentoFinanceiro(
  data: {
    tipo: 'Entrada' | 'Saída' | 'Serviço';
    categoria: string;
    valor: number;
    descricao: string;
    data: string;
  },
  saldoDisponivel?: number
): ValidacaoResultado {
  const erros: string[] = [];

  if (!data.valor || isNaN(data.valor) || data.valor <= 0) {
    erros.push('O valor do lançamento deve ser maior que zero.');
  }

  if (!data.descricao || !data.descricao.trim()) {
    erros.push('A descrição não pode ser vazia.');
  }

  if (!data.categoria || !data.categoria.trim()) {
    erros.push('Uma categoria deve ser selecionada.');
  }

  if (!data.data || !data.data.trim()) {
    erros.push('A data inserida é inválida.');
  } else {
    const parsedDate = new Date(data.data);
    if (isNaN(parsedDate.getTime())) {
      erros.push('O formato da data é inválido.');
    }
  }

  if (data.tipo === 'Saída' && saldoDisponivel !== undefined) {
    if (data.valor > saldoDisponivel) {
      erros.push(`Saldo insuficiente para esta saída. Saldo disponível: R$ ${saldoDisponivel.toFixed(2)}.`);
    }
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Valida um evento
 */
export function validarEvento(data: {
  nome: string;
  data: string;
  meta_financeira: number;
}): ValidacaoResultado {
  const erros: string[] = [];

  if (!data.nome || !data.nome.trim()) {
    erros.push('O nome do evento não pode ser vazio.');
  }

  if (!data.data || !data.data.trim()) {
    erros.push('A data do evento é obrigatória.');
  } else {
    const inputDate = new Date(data.data);
    if (isNaN(inputDate.getTime())) {
      erros.push('A data informada é inválida.');
    } else {
      // Cria a data de hoje sem horas para comparar apenas datas
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataEvento = new Date(inputDate);
      dataEvento.setHours(0, 0, 0, 0);

      if (dataEvento < hoje) {
        erros.push('A data do evento deve ser hoje ou em uma data futura.');
      }
    }
  }

  if (data.meta_financeira < 0 || isNaN(data.meta_financeira)) {
    erros.push('A meta financeira não pode ser negativa.');
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Valida um membro
 */
export function validarMembro(data: {
  nome: string;
  email: string;
  whatsapp: string;
}): ValidacaoResultado {
  const erros: string[] = [];

  if (!data.nome || !data.nome.trim()) {
    erros.push('O nome do membro é obrigatório e não pode ser vazio.');
  }

  if (data.email && data.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      erros.push('O formato do e-mail é inválido.');
    }
  }

  if (!data.whatsapp || !data.whatsapp.trim()) {
    erros.push('O telefone/WhatsApp é obrigatório.');
  } else {
    // Valida telefone: deve conter pelo menos 10 dígitos numéricos (com DDD)
    const numerosApenas = data.whatsapp.replace(/\D/g, '');
    if (numerosApenas.length < 10 || numerosApenas.length > 15) {
      erros.push('O telefone/WhatsApp deve conter o DDD e de 10 a 11 dígitos.');
    }
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Formata os erros em uma string legível para exibição ao usuário
 */
export function formatarErros(erros: string[]): string {
  return erros.map(erro => `• ${erro}`).join('\n');
}
