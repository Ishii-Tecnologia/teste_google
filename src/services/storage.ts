import {
  Titulo,
  Exemplar,
  Leitor,
  Emprestimo,
  Reserva,
  HistoricoMovimentacao,
  ParametroSistema,
  UsuarioSistema,
} from '../types';

const STORAGE_KEYS = {
  TITULOS: 'cep_biblioteca_titulos_v2',
  EXEMPLARES: 'cep_biblioteca_exemplares_v2',
  LEITORES: 'cep_biblioteca_leitores_v2',
  EMPRESTIMOS: 'cep_biblioteca_emprestimos_v2',
  RESERVAS: 'cep_biblioteca_reservas_v2',
  HISTORICO: 'cep_biblioteca_historico_v2',
  PARAMETROS: 'cep_biblioteca_parametros_v2',
  USUARIOS: 'cep_biblioteca_usuarios_v2',
  CURRENT_USER: 'cep_biblioteca_current_user_v2',
};

// Initial Seed Data
const INITIAL_TITULOS: Titulo[] = [
  {
    id_titulo: 'CX001',
    titulo_de_livro: 'Nosso Lar',
    autor: 'Chico Xavier',
    editora: 'FEB Editora',
    ano_publicacao: 1944,
    isbn: '978-8573289442',
    categoria: 'Romance Mediúnico',
    vol: 3,
    capa_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
    ativo: true,
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id_titulo: 'AK001',
    titulo_de_livro: 'O Livro dos Espíritos',
    autor: 'Allan Kardec',
    editora: 'FEB Editora',
    ano_publicacao: 1857,
    isbn: '978-8573289213',
    categoria: 'Doutrina Espírita',
    vol: 4,
    capa_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
    ativo: true,
    created_at: '2026-01-11T11:00:00Z',
  },
  {
    id_titulo: 'AK002',
    titulo_de_livro: 'O Evangelho Segundo o Espiritismo',
    autor: 'Allan Kardec',
    editora: 'IDE Editora',
    ano_publicacao: 1864,
    isbn: '978-8573289220',
    categoria: 'Doutrina Espírita',
    vol: 3,
    capa_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    ativo: true,
    created_at: '2026-01-12T14:30:00Z',
  },
  {
    id_titulo: 'YP001',
    titulo_de_livro: 'Memórias de um Suicida',
    autor: 'Yvonne Pereira',
    editora: 'FEB Editora',
    ano_publicacao: 1955,
    isbn: '978-8573289350',
    categoria: 'Estudo e Romance',
    vol: 2,
    capa_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=400',
    ativo: true,
    created_at: '2026-01-15T09:15:00Z',
  },
  {
    id_titulo: 'DL001',
    titulo_de_livro: 'Violetas na Janela',
    autor: 'Divaldo Franco',
    editora: 'LEAL Editora',
    ano_publicacao: 1993,
    isbn: '978-8573289701',
    categoria: 'Literatura Espírita',
    vol: 2,
    capa_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400',
    ativo: true,
    created_at: '2026-01-18T16:00:00Z',
  },
];

const INITIAL_EXEMPLARES: Exemplar[] = [
  // CX001 copies
  {
    id_exemplar: 'CX001-1',
    id_titulo: 'CX001',
    seq: 1,
    status: 'Emprestado',
    localizacao: 'Estante A, Prateleira 1',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id_exemplar: 'CX001-2',
    id_titulo: 'CX001',
    seq: 2,
    status: 'Disponivel',
    localizacao: 'Estante A, Prateleira 1',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id_exemplar: 'CX001-3',
    id_titulo: 'CX001',
    seq: 3,
    status: 'Reservado',
    localizacao: 'Estante A, Prateleira 1',
    created_at: '2026-01-10T10:00:00Z',
  },
  // AK001 copies
  {
    id_exemplar: 'AK001-1',
    id_titulo: 'AK001',
    seq: 1,
    status: 'Emprestado',
    localizacao: 'Estante B, Prateleira 3',
    created_at: '2026-01-11T11:00:00Z',
  },
  {
    id_exemplar: 'AK001-2',
    id_titulo: 'AK001',
    seq: 2,
    status: 'Disponivel',
    localizacao: 'Estante B, Prateleira 3',
    created_at: '2026-01-11T11:00:00Z',
  },
  {
    id_exemplar: 'AK001-3',
    id_titulo: 'AK001',
    seq: 3,
    status: 'Disponivel',
    localizacao: 'Estante B, Prateleira 3',
    created_at: '2026-01-11T11:00:00Z',
  },
  {
    id_exemplar: 'AK001-4',
    id_titulo: 'AK001',
    seq: 4,
    status: 'Manutencao',
    localizacao: 'Oficina de Restauração',
    created_at: '2026-01-11T11:00:00Z',
  },
  // AK002 copies
  {
    id_exemplar: 'AK002-1',
    id_titulo: 'AK002',
    seq: 1,
    status: 'Disponivel',
    localizacao: 'Estante B, Prateleira 4',
    created_at: '2026-01-12T14:30:00Z',
  },
  {
    id_exemplar: 'AK002-2',
    id_titulo: 'AK002',
    seq: 2,
    status: 'Disponivel',
    localizacao: 'Estante B, Prateleira 4',
    created_at: '2026-01-12T14:30:00Z',
  },
  {
    id_exemplar: 'AK002-3',
    id_titulo: 'AK002',
    seq: 3,
    status: 'Disponivel',
    localizacao: 'Estante B, Prateleira 4',
    created_at: '2026-01-12T14:30:00Z',
  },
  // YP001 copies
  {
    id_exemplar: 'YP001-1',
    id_titulo: 'YP001',
    seq: 1,
    status: 'Disponivel',
    localizacao: 'Estante C, Prateleira 2',
    created_at: '2026-01-15T09:15:00Z',
  },
  {
    id_exemplar: 'YP001-2',
    id_titulo: 'YP001',
    seq: 2,
    status: 'Disponivel',
    localizacao: 'Estante C, Prateleira 2',
    created_at: '2026-01-15T09:15:00Z',
  },
  // DL001 copies
  {
    id_exemplar: 'DL001-1',
    id_titulo: 'DL001',
    seq: 1,
    status: 'Disponivel',
    localizacao: 'Estante D, Prateleira 1',
    created_at: '2026-01-18T16:00:00Z',
  },
  {
    id_exemplar: 'DL001-2',
    id_titulo: 'DL001',
    seq: 2,
    status: 'Disponivel',
    localizacao: 'Estante D, Prateleira 1',
    created_at: '2026-01-18T16:00:00Z',
  },
];

const INITIAL_LEITORES: Leitor[] = [
  {
    id_leitor: 101,
    cpf: '123.456.789-00',
    nome_do_leitor: 'Maria Helena Silva',
    email: 'maria.helena@email.com',
    telefone: '(61) 98765-4321',
    data_cadastro: '2026-01-05T08:00:00Z',
    bloqueado: false,
    created_at: '2026-01-05T08:00:00Z',
  },
  {
    id_leitor: 102,
    cpf: '987.654.321-99',
    nome_do_leitor: 'Carlos Eduardo Santos',
    email: 'carlos.edu@email.com',
    telefone: '(61) 99123-4567',
    data_cadastro: '2026-01-08T09:30:00Z',
    bloqueado: true,
    motivo_bloqueio: 'Bloqueio automático por atraso na devolução do exemplar AK001-1',
    created_at: '2026-01-08T09:30:00Z',
  },
  {
    id_leitor: 103,
    cpf: '456.789.123-44',
    nome_do_leitor: 'Ana Clara Albuquerque',
    email: 'ana.clara@email.com',
    telefone: '(61) 98456-7890',
    data_cadastro: '2026-01-12T14:00:00Z',
    bloqueado: false,
    created_at: '2026-01-12T14:00:00Z',
  },
  {
    id_leitor: 104,
    cpf: '321.654.987-11',
    nome_do_leitor: 'Roberto Farias',
    email: 'roberto.farias@email.com',
    telefone: '(61) 99876-5432',
    data_cadastro: '2026-01-15T11:20:00Z',
    bloqueado: false,
    created_at: '2026-01-15T11:20:00Z',
  },
];

const now = new Date();
const addDays = (date: Date, days: number): string => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString();
};

const INITIAL_EMPRESTIMOS: Emprestimo[] = [
  {
    id_emprestimo: 1,
    id_exemplar: 'CX001-1',
    id_leitor: 101,
    data_emprestimo: addDays(now, -5),
    data_prevista_devolucao: addDays(now, 10),
    atraso: false,
    renovado: false,
    created_at: addDays(now, -5),
  },
  {
    id_emprestimo: 2,
    id_exemplar: 'AK001-1',
    id_leitor: 102,
    data_emprestimo: addDays(now, -20),
    data_prevista_devolucao: addDays(now, -5),
    atraso: true,
    dias_atraso: 5,
    renovado: false,
    created_at: addDays(now, -20),
  },
  {
    id_emprestimo: 3,
    id_exemplar: 'YP001-1',
    id_leitor: 104,
    data_emprestimo: addDays(now, -30),
    data_prevista_devolucao: addDays(now, -15),
    data_devolucao_real: addDays(now, -16),
    atraso: false,
    dias_atraso: 0,
    renovado: true,
    created_at: addDays(now, -30),
  },
];

const INITIAL_RESERVAS: Reserva[] = [
  {
    id_reserva: 1,
    id_titulo: 'CX001',
    id_leitor: 103,
    data_reserva: addDays(now, -2),
    status_reserva: 'Ativa',
    observacoes: 'Avisar por WhatsApp assim que o exemplar CX001-3 estiver liberado.',
    created_at: addDays(now, -2),
  },
];

const INITIAL_PARAMETROS: ParametroSistema[] = [
  {
    id_parametro: 1,
    chave_parametro: 'DIAS_PADRAO_EMPRESTIMO',
    nome_parametro: 'prazo_devolucao_dias',
    valor_parametro: '15',
    descricao_parametro: 'Prazo padrão em dias corridos para devolução de empréstimos.',
    descricao: 'Prazo padrão em dias corridos para devolução de empréstimos.',
    tipo_dado: 'number',
    ultima_atualizacao: '2026-01-01T00:00:00Z',
    atualizado_por: 'admin',
  },
  {
    id_parametro: 2,
    chave_parametro: 'MAX_RENOVACOES_PERMITIDAS',
    nome_parametro: 'max_renovacoes_permitidas',
    valor_parametro: '1',
    descricao_parametro: 'Número máximo de renovações consecutivas permitidas por exemplar (padrão: 1).',
    descricao: 'Número máximo de renovações consecutivas permitidas por exemplar.',
    tipo_dado: 'number',
    ultima_atualizacao: '2026-01-01T00:00:00Z',
    atualizado_por: 'admin',
  },
  {
    id_parametro: 3,
    chave_parametro: 'DIAS_AVISO_VENCIMENTO',
    nome_parametro: 'dias_alerta_vencimento_proximo',
    valor_parametro: '2',
    descricao_parametro: 'Número de dias antes do vencimento para destacar no semáforo amarelo.',
    descricao: 'Número de dias antes do vencimento para destacar em amarelo.',
    tipo_dado: 'number',
    ultima_atualizacao: '2026-01-01T00:00:00Z',
    atualizado_por: 'admin',
  },
  {
    id_parametro: 4,
    chave_parametro: 'BLOQUEIO_AUTOMATICO_INADIMPLENTE',
    nome_parametro: 'bloqueio_automatico_por_atraso',
    valor_parametro: 'true',
    descricao_parametro: 'Bloquear automaticamente novos empréstimos para leitores com devoluções atrasadas.',
    descricao: 'Bloquear automaticamente novos empréstimos para leitores com devoluções atrasadas.',
    tipo_dado: 'boolean',
    ultima_atualizacao: '2026-01-01T00:00:00Z',
    atualizado_por: 'admin',
  },
  {
    id_parametro: 5,
    chave_parametro: 'NOME_BIBLIOTECA',
    nome_parametro: 'nome_instituicao',
    valor_parametro: 'Biblioteca CEP - Centro Educacional Profissional',
    descricao_parametro: 'Nome oficial exibido no cabeçalho, comprovantes e relatórios.',
    descricao: 'Nome oficial exibido no cabeçalho e nos relatórios de auditoria.',
    tipo_dado: 'string',
    ultima_atualizacao: '2026-01-01T00:00:00Z',
    atualizado_por: 'admin',
  },
];

const INITIAL_USUARIOS: UsuarioSistema[] = [
  {
    id_usuario: 1,
    username: 'admin',
    login: 'admin',
    nome_completo: 'Administrador Geral',
    nome: 'Administrador Geral',
    senha_hash: 'admin123',
    senha: '123',
    email: 'admin@cep-biblioteca.org.br',
    perfil: 'ADMIN',
    ativo: true,
    ultimo_acesso: '2026-08-23T17:30:00Z',
    criado_em: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id_usuario: 2,
    username: 'fernanda',
    login: 'fernanda',
    nome_completo: 'Fernanda Oliveira (Bibliotecária)',
    nome: 'Fernanda Oliveira',
    senha_hash: 'biblio123',
    senha: '123',
    email: 'fernanda.operador@cep-biblioteca.org.br',
    perfil: 'BIBLIOTECARIO',
    ativo: true,
    ultimo_acesso: '2026-08-23T16:45:00Z',
    criado_em: '2026-01-02T00:00:00Z',
    created_at: '2026-01-02T00:00:00Z',
  },
  {
    id_usuario: 3,
    username: 'marcos',
    login: 'marcos',
    nome_completo: 'Marcos Vinícius (Atendente de Balcão)',
    nome: 'Marcos Vinícius',
    senha_hash: 'balcao123',
    senha: '123',
    email: 'marcos.atendente@cep-biblioteca.org.br',
    perfil: 'ATENDENTE',
    ativo: true,
    ultimo_acesso: '2026-08-23T15:20:00Z',
    criado_em: '2026-01-05T00:00:00Z',
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id_usuario: 4,
    username: 'consultor',
    login: 'consultor',
    nome_completo: 'Dra. Sandra Prado (Auditora Externa)',
    nome: 'Sandra Prado',
    senha_hash: 'consulta123',
    senha: '123',
    email: 'sandra.auditoria@cep-biblioteca.org.br',
    perfil: 'CONSULTOR',
    ativo: true,
    ultimo_acesso: '2026-08-22T14:10:00Z',
    criado_em: '2026-01-08T00:00:00Z',
    created_at: '2026-01-08T00:00:00Z',
  },
];

const INITIAL_HISTORICO: HistoricoMovimentacao[] = [
  {
    id_log: 1,
    id_exemplar: 'CX001-1',
    id_leitor: 101,
    tipo_operacao: 'Retirada',
    data_hora: addDays(now, -5),
    usuario_sistema: 'fernanda',
    detalhes: 'Empréstimo inicial de 15 dias',
  },
  {
    id_log: 2,
    id_exemplar: 'AK001-1',
    id_leitor: 102,
    tipo_operacao: 'Retirada',
    data_hora: addDays(now, -20),
    usuario_sistema: 'fernanda',
    detalhes: 'Retirada efetuada no balcão',
  },
  {
    id_log: 3,
    id_exemplar: 'YP001-1',
    id_leitor: 104,
    tipo_operacao: 'Devolucao',
    data_hora: addDays(now, -16),
    usuario_sistema: 'marcos',
    detalhes: 'Devolução pontual sem avarias',
  },
  {
    id_log: 4,
    id_exemplar: 'CX001-3',
    id_leitor: 103,
    tipo_operacao: 'Reserva',
    data_hora: addDays(now, -2),
    usuario_sistema: 'marcos',
    detalhes: 'Reserva solicitada no balcão presencial',
  },
];

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  }

  public init() {
    if (!localStorage.getItem(STORAGE_KEYS.TITULOS)) {
      this.set(STORAGE_KEYS.TITULOS, INITIAL_TITULOS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXEMPLARES)) {
      this.set(STORAGE_KEYS.EXEMPLARES, INITIAL_EXEMPLARES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEITORES)) {
      this.set(STORAGE_KEYS.LEITORES, INITIAL_LEITORES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMPRESTIMOS)) {
      this.set(STORAGE_KEYS.EMPRESTIMOS, INITIAL_EMPRESTIMOS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RESERVAS)) {
      this.set(STORAGE_KEYS.RESERVAS, INITIAL_RESERVAS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HISTORICO)) {
      this.set(STORAGE_KEYS.HISTORICO, INITIAL_HISTORICO);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PARAMETROS)) {
      this.set(STORAGE_KEYS.PARAMETROS, INITIAL_PARAMETROS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USUARIOS)) {
      this.set(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      this.set(STORAGE_KEYS.CURRENT_USER, INITIAL_USUARIOS[0]);
    }
  }

  public getTitulos(): Titulo[] {
    return this.get<Titulo[]>(STORAGE_KEYS.TITULOS, INITIAL_TITULOS);
  }
  public saveTitulos(data: Titulo[]): void {
    this.set(STORAGE_KEYS.TITULOS, data);
  }

  public getExemplares(): Exemplar[] {
    return this.get<Exemplar[]>(STORAGE_KEYS.EXEMPLARES, INITIAL_EXEMPLARES);
  }
  public saveExemplares(data: Exemplar[]): void {
    this.set(STORAGE_KEYS.EXEMPLARES, data);
  }

  public getLeitores(): Leitor[] {
    return this.get<Leitor[]>(STORAGE_KEYS.LEITORES, INITIAL_LEITORES);
  }
  public saveLeitores(data: Leitor[]): void {
    this.set(STORAGE_KEYS.LEITORES, data);
  }

  public getEmprestimos(): Emprestimo[] {
    return this.get<Emprestimo[]>(STORAGE_KEYS.EMPRESTIMOS, INITIAL_EMPRESTIMOS);
  }
  public saveEmprestimos(data: Emprestimo[]): void {
    this.set(STORAGE_KEYS.EMPRESTIMOS, data);
  }

  public getReservas(): Reserva[] {
    return this.get<Reserva[]>(STORAGE_KEYS.RESERVAS, INITIAL_RESERVAS);
  }
  public saveReservas(data: Reserva[]): void {
    this.set(STORAGE_KEYS.RESERVAS, data);
  }

  public getHistorico(): HistoricoMovimentacao[] {
    return this.get<HistoricoMovimentacao[]>(STORAGE_KEYS.HISTORICO, INITIAL_HISTORICO);
  }
  public saveHistorico(data: HistoricoMovimentacao[]): void {
    this.set(STORAGE_KEYS.HISTORICO, data);
  }

  public getParametros(): ParametroSistema[] {
    return this.get<ParametroSistema[]>(STORAGE_KEYS.PARAMETROS, INITIAL_PARAMETROS);
  }
  public saveParametros(data: ParametroSistema[]): void {
    this.set(STORAGE_KEYS.PARAMETROS, data);
  }

  public getUsuarios(): UsuarioSistema[] {
    return this.get<UsuarioSistema[]>(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
  }
  public saveUsuarios(data: UsuarioSistema[]): void {
    this.set(STORAGE_KEYS.USUARIOS, data);
  }

  public getCurrentUser(): UsuarioSistema {
    return this.get<UsuarioSistema>(STORAGE_KEYS.CURRENT_USER, INITIAL_USUARIOS[0]);
  }
  public saveCurrentUser(user: UsuarioSistema): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }
  public setCurrentUser(user: UsuarioSistema): void {
    this.saveCurrentUser(user);
  }

  public resetToFactoryDefaults(): void {
    this.set(STORAGE_KEYS.TITULOS, INITIAL_TITULOS);
    this.set(STORAGE_KEYS.EXEMPLARES, INITIAL_EXEMPLARES);
    this.set(STORAGE_KEYS.LEITORES, INITIAL_LEITORES);
    this.set(STORAGE_KEYS.EMPRESTIMOS, INITIAL_EMPRESTIMOS);
    this.set(STORAGE_KEYS.RESERVAS, INITIAL_RESERVAS);
    this.set(STORAGE_KEYS.HISTORICO, INITIAL_HISTORICO);
    this.set(STORAGE_KEYS.PARAMETROS, INITIAL_PARAMETROS);
    this.set(STORAGE_KEYS.USUARIOS, INITIAL_USUARIOS);
    this.set(STORAGE_KEYS.CURRENT_USER, INITIAL_USUARIOS[0]);
  }
}

export const storageService = new StorageService();
storageService.init();
