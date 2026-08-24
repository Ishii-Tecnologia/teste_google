export type StatusExemplar = 'Disponivel' | 'Emprestado' | 'Indisponivel' | 'Reservado' | 'Manutencao';
export type StatusReserva = 'Ativa' | 'Atendida' | 'Cancelada' | 'Expirada';
export type TipoOperacao = 'Retirada' | 'Devolucao' | 'Renovacao' | 'Reserva' | 'Baixa';
export type PerfilUsuario =
  | 'ADMIN'
  | 'BIBLIOTECARIO'
  | 'ATENDENTE'
  | 'CONSULTOR'
  | 'Administrador'
  | 'Operador'
  | 'Leitor';

export interface Titulo {
  id_titulo: string; // ex: CX001
  titulo_de_livro: string;
  autor: string;
  editora?: string;
  ano_publicacao?: number;
  isbn?: string;
  categoria?: string;
  vol: number; // quantidade total de exemplares vinculados
  capa_url?: string;
  ativo: boolean; // soft delete
  created_at: string;
}

export interface Exemplar {
  id_exemplar: string; // ex: CX001-1
  id_titulo: string;
  seq: number;
  status: StatusExemplar;
  localizacao?: string; // ex: Estante A, Prateleira 2
  created_at: string;
}

export interface Leitor {
  id_leitor: number; // ID único numérico
  cpf?: string;
  nome_do_leitor: string;
  email: string;
  telefone?: string;
  data_cadastro: string;
  bloqueado: boolean;
  motivo_bloqueio?: string;
  created_at: string;
}

export interface Emprestimo {
  id_emprestimo: number;
  id_exemplar: string;
  id_leitor: number;
  data_emprestimo: string;
  data_prevista_devolucao: string;
  data_devolucao_real?: string;
  atraso: boolean;
  dias_atraso?: number;
  renovado?: boolean; // controle de renovação única
  created_at: string;
}

export interface Reserva {
  id_reserva: number;
  id_titulo: string;
  id_leitor: number;
  data_reserva: string;
  status_reserva: StatusReserva;
  observacoes?: string;
  created_at: string;
}

export interface HistoricoMovimentacao {
  id_log: number;
  id_exemplar: string;
  id_leitor?: number;
  tipo_operacao: TipoOperacao;
  data_hora: string;
  usuario_sistema: string;
  detalhes?: string;
}

export interface ParametroSistema {
  id_parametro: number;
  chave_parametro: string;
  nome_parametro?: string;
  valor_parametro: string;
  descricao_parametro: string;
  descricao?: string;
  tipo_dado: 'number' | 'string' | 'boolean';
  ultima_atualizacao: string;
  atualizado_por: string;
}

export interface UsuarioSistema {
  id_usuario: number;
  username: string;
  login?: string;
  nome_completo: string;
  nome?: string;
  senha_hash: string;
  senha?: string;
  email: string;
  perfil: PerfilUsuario;
  id_leitor_vinculado?: number; // caso seja perfil leitor
  ativo: boolean;
  ultimo_acesso?: string;
  criado_em?: string;
  created_at?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'titulos'
  | 'exemplares'
  | 'circulacao'
  | 'reservas'
  | 'leitores'
  | 'historico'
  | 'relatorios'
  | 'parametros'
  | 'usuarios';
