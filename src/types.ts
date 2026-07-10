export interface Membro {
  id: string;
  nome: string;
  nascimento: string;
  whatsapp: string;
  email: string;
  profissao: string;
  escolaridade?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  rg?: string;
  cpf?: string;
  contribuicao_sugerida: number;
  status: 'Ativo' | 'Inativo';
  isDependent?: boolean;
  parentEmail?: string;
}

export interface Financeiro {
  id: string;
  tipo: 'Entrada' | 'Saída' | 'Serviço';
  categoria: string;
  valor: number;
  data: string;
  id_membro?: string;
  doador_nome?: string;
  id_evento?: string;
  id_banco?: string;
  descricao: string;
  horas_trabalhadas?: number;
  comprovanteUrl?: string;
  modificado_por_email?: string;
}

export interface AuditLog {
  id: string;
  data: string;
  usuario_email: string;
  acao: string;
  resumo: string;
}

export interface ItemNecessidade {
  id: string;
  id_evento: string;
  nome: string;
  quantidade: number;
  unidade: string;
  id_membro_doador?: string;
  concluido: boolean;
}

export interface Evento {
  id: string;
  nome: string;
  data: string;
  meta_financeira: number;
  status: 'Aberto' | 'Concluído';
}
