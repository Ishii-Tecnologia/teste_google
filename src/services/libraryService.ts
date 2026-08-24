import { storageService } from './storage';
import {
  Titulo,
  Exemplar,
  Leitor,
  Emprestimo,
  Reserva,
  HistoricoMovimentacao,
  ParametroSistema,
  UsuarioSistema,
  StatusExemplar,
  PerfilUsuario,
} from '../types';

export class LibraryService {
  // ==========================================
  // HELPER: INITIALS GENERATION (<INICIAIS><nnn>)
  // ==========================================
  public generateInitials(autor: string): string {
    if (!autor || !autor.trim()) return 'OB';
    
    // Normalize and remove special characters
    const cleanName = autor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    // Ignore prepositions
    const ignoredWords = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'del', 'van', 'von', 'd']);
    const parts = cleanName
      .split(/\s+/)
      .filter((p) => p.length > 0 && !ignoredWords.has(p.toLowerCase()));

    if (parts.length === 0) return 'OB';

    if (parts.length === 1) {
      const single = parts[0].toUpperCase();
      return single.length >= 2 ? single.substring(0, 2) : (single + 'X').substring(0, 2);
    }

    const firstLetter = parts[0][0].toUpperCase();
    const lastLetter = parts[parts.length - 1][0].toUpperCase();
    return `${firstLetter}${lastLetter}`;
  }

  public getNextTitleId(autor: string): string {
    const prefix = this.generateInitials(autor);
    const titulos = storageService.getTitulos();
    
    // Find all titles with matching prefix
    const matching = titulos
      .map((t) => t.id_titulo)
      .filter((id) => id.startsWith(prefix));

    let maxSeq = 0;
    matching.forEach((id) => {
      const numPart = id.substring(prefix.length);
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    });

    const nextNumber = (maxSeq + 1).toString().padStart(3, '0');
    return `${prefix}${nextNumber}`;
  }

  // ==========================================
  // PARAMETERS
  // ==========================================
  public getParam(name: string, fallback: string): string {
    const params = storageService.getParametros();
    const found = params.find((p) => p.nome_parametro === name || p.chave_parametro === name || p.chave_parametro === name.toUpperCase());
    return found ? found.valor_parametro : fallback;
  }

  public getLoanDays(): number {
    const val = this.getParam('DIAS_PADRAO_EMPRESTIMO', this.getParam('prazo_devolucao_dias', '15'));
    return parseInt(val, 10) || 15;
  }

  public getMaxLoansPerReader(): number {
    const val = this.getParam('LIMITE_EMPRESTIMOS_POR_LEITOR', this.getParam('limite_emprestimos_por_leitor', '3'));
    return parseInt(val, 10) || 3;
  }

  public isAutoBlockEnabled(): boolean {
    return this.getParam('BLOQUEIO_AUTOMATICO_INADIMPLENTE', this.getParam('bloqueio_automatico_por_atraso', 'true')) === 'true';
  }

  // ==========================================
  // TITULO CRUD & BUSINESS RULES
  // ==========================================
  public createTitulo(data: Omit<Titulo, 'id_titulo' | 'ativo' | 'created_at'> & { custom_id?: string; localizacao_padrao?: string }): { success: boolean; message: string; titulo?: Titulo } {
    if (!data.titulo_de_livro?.trim() || !data.autor?.trim()) {
      return { success: false, message: 'Título e Autor são campos obrigatórios.' };
    }

    if (data.ano_publicacao && (data.ano_publicacao < 1000 || data.ano_publicacao > 2200)) {
      return { success: false, message: 'Ano de publicação deve estar entre 1000 e 2200.' };
    }

    if (data.vol < 0) {
      return { success: false, message: 'A quantidade de volumes deve ser maior ou igual a zero.' };
    }

    const titulos = storageService.getTitulos();

    // Check duplicate ISBN
    if (data.isbn && data.isbn.trim()) {
      const existsIsbn = titulos.some(
        (t) => t.isbn && t.isbn.trim().toLowerCase() === data.isbn?.trim().toLowerCase() && t.ativo
      );
      if (existsIsbn) {
        return { success: false, message: `Já existe um título cadastrado com o ISBN "${data.isbn}".` };
      }
    }

    // Check duplicate Title + Author
    const existsTitleAuthor = titulos.some(
      (t) =>
        t.titulo_de_livro.trim().toLowerCase() === data.titulo_de_livro.trim().toLowerCase() &&
        t.autor.trim().toLowerCase() === data.autor.trim().toLowerCase() &&
        t.ativo
    );
    if (existsTitleAuthor) {
      return { success: false, message: `A obra "${data.titulo_de_livro}" do autor "${data.autor}" já está cadastrada.` };
    }

    const id_titulo = data.custom_id?.trim() || this.getNextTitleId(data.autor);
    const newTitulo: Titulo = {
      id_titulo,
      titulo_de_livro: data.titulo_de_livro.trim(),
      autor: data.autor.trim(),
      editora: data.editora?.trim(),
      ano_publicacao: data.ano_publicacao,
      isbn: data.isbn?.trim(),
      categoria: data.categoria?.trim() || 'Geral',
      vol: data.vol || 0,
      capa_url: data.capa_url?.trim(),
      ativo: true,
      created_at: new Date().toISOString(),
    };

    titulos.unshift(newTitulo);
    storageService.saveTitulos(titulos);

    // Auto-generate physical exemplares based on volume count
    if (newTitulo.vol > 0) {
      const exemplares = storageService.getExemplares();
      for (let seq = 1; seq <= newTitulo.vol; seq++) {
        const id_exemplar = `${id_titulo}-${seq}`;
        exemplares.push({
          id_exemplar,
          id_titulo,
          seq,
          status: 'Disponivel',
          localizacao: data.localizacao_padrao || 'Estante Geral, Prateleira 1',
          created_at: new Date().toISOString(),
        });
      }
      storageService.saveExemplares(exemplares);
    }

    return { success: true, message: `Título "${newTitulo.titulo_de_livro}" criado com sucesso (ID: ${id_titulo}) e ${newTitulo.vol} exemplares gerados.`, titulo: newTitulo };
  }

  public updateTitulo(id_titulo: string, data: Partial<Omit<Titulo, 'id_titulo' | 'created_at'>> & { localizacao_padrao?: string }): { success: boolean; message: string } {
    const titulos = storageService.getTitulos();
    const index = titulos.findIndex((t) => t.id_titulo === id_titulo);
    if (index === -1) {
      return { success: false, message: 'Título não encontrado.' };
    }

    const current = titulos[index];

    // Check volume changes rule
    if (data.vol !== undefined && data.vol !== current.vol) {
      const newVol = data.vol;
      if (newVol < 0) {
        return { success: false, message: 'Volume não pode ser negativo.' };
      }

      const allExemplares = storageService.getExemplares();
      const currentCopies = allExemplares.filter((e) => e.id_titulo === id_titulo).sort((a, b) => a.seq - b.seq);

      if (newVol > current.vol) {
        // Add new copies
        const startSeq = currentCopies.length > 0 ? Math.max(...currentCopies.map((c) => c.seq)) + 1 : 1;
        const countToAdd = newVol - current.vol;
        for (let i = 0; i < countToAdd; i++) {
          const seq = startSeq + i;
          allExemplares.push({
            id_exemplar: `${id_titulo}-${seq}`,
            id_titulo,
            seq,
            status: 'Disponivel',
            localizacao: data.localizacao_padrao || 'Estante Geral, Prateleira 1',
            created_at: new Date().toISOString(),
          });
        }
        storageService.saveExemplares(allExemplares);
      } else if (newVol < current.vol) {
        // Need to remove excess copies - MUST be 'Disponivel'
        const excessCount = current.vol - newVol;
        const sortedDesc = [...currentCopies].reverse();
        const candidates = sortedDesc.slice(0, excessCount);

        const nonAvailable = candidates.filter((c) => c.status !== 'Disponivel');
        if (nonAvailable.length > 0) {
          return {
            success: false,
            message: `Não é possível reduzir volumes: o exemplar ${nonAvailable[0].id_exemplar} está com status "${nonAvailable[0].status}". Apenas exemplares disponíveis podem ser removidos.`,
          };
        }

        const candidateIds = new Set(candidates.map((c) => c.id_exemplar));
        const updatedExemplares = allExemplares.filter((e) => !candidateIds.has(e.id_exemplar));
        storageService.saveExemplares(updatedExemplares);
      }
    }

    titulos[index] = {
      ...current,
      ...data,
      id_titulo: current.id_titulo, // Immutable PK
    };

    storageService.saveTitulos(titulos);
    return { success: true, message: 'Título atualizado com sucesso.' };
  }

  public deleteTitulo(id_titulo: string): { success: boolean; message: string } {
    const titulos = storageService.getTitulos();
    const titulo = titulos.find((t) => t.id_titulo === id_titulo);
    if (!titulo) {
      return { success: false, message: 'Título não encontrado.' };
    }

    // Check active loans
    const exemplares = storageService.getExemplares().filter((e) => e.id_titulo === id_titulo);
    const hasActiveLoans = exemplares.some((e) => e.status === 'Emprestado');
    if (hasActiveLoans) {
      return { success: false, message: 'Impossível desativar: existem exemplares deste título atualmente emprestados.' };
    }

    // Check active reservations
    const reservas = storageService.getReservas();
    const hasActiveReservations = reservas.some((r) => r.id_titulo === id_titulo && r.status_reserva === 'Ativa');
    if (hasActiveReservations) {
      return { success: false, message: 'Impossível desativar: existem reservas ativas na fila para este título.' };
    }

    // Soft delete rule as requested in doc
    titulo.ativo = false;
    storageService.saveTitulos(titulos);

    // Also mark physical copies
    const allExemplares = storageService.getExemplares();
    allExemplares.forEach((e) => {
      if (e.id_titulo === id_titulo && e.status === 'Disponivel') {
        e.status = 'Indisponivel';
      }
    });
    storageService.saveExemplares(allExemplares);

    return { success: true, message: `Título "${titulo.titulo_de_livro}" desativado (soft delete) com sucesso.` };
  }

  // ==========================================
  // EXEMPLAR CRUD
  // ==========================================
  public createExemplar(id_titulo: string, localizacao?: string): { success: boolean; message: string; exemplar?: Exemplar } {
    const titulos = storageService.getTitulos();
    const titulo = titulos.find((t) => t.id_titulo === id_titulo && t.ativo);
    if (!titulo) {
      return { success: false, message: 'Título não encontrado ou inativo.' };
    }

    const allExemplares = storageService.getExemplares();
    const existing = allExemplares.filter((e) => e.id_titulo === id_titulo);
    const maxSeq = existing.length > 0 ? Math.max(...existing.map((e) => e.seq)) : 0;
    const nextSeq = maxSeq + 1;
    const id_exemplar = `${id_titulo}-${nextSeq}`;

    const newExemplar: Exemplar = {
      id_exemplar,
      id_titulo,
      seq: nextSeq,
      status: 'Disponivel',
      localizacao: localizacao?.trim() || 'Estante Geral',
      created_at: new Date().toISOString(),
    };

    allExemplares.push(newExemplar);
    storageService.saveExemplares(allExemplares);

    // Update volume in Titulo
    titulo.vol = allExemplares.filter((e) => e.id_titulo === id_titulo).length;
    storageService.saveTitulos(titulos);

    this.logAuditoria({
      id_exemplar,
      tipo_operacao: 'Retirada', // or initial registration
      usuario_sistema: this.getCurrentUsername(),
      detalhes: `Novo exemplar físico cadastrado (${newExemplar.localizacao})`,
    });

    return { success: true, message: `Exemplar ${id_exemplar} cadastrado com sucesso.`, exemplar: newExemplar };
  }

  public updateExemplar(id_exemplar: string, data: { status?: StatusExemplar; localizacao?: string }): { success: boolean; message: string } {
    const exemplares = storageService.getExemplares();
    const exemplar = exemplares.find((e) => e.id_exemplar === id_exemplar);
    if (!exemplar) {
      return { success: false, message: 'Exemplar não encontrado.' };
    }

    if (exemplar.status === 'Emprestado' && data.status && data.status !== 'Emprestado') {
      return { success: false, message: 'Exemplar está atualmente emprestado. Para alterar o status, finalize a devolução no módulo de circulação.' };
    }

    if (data.status) exemplar.status = data.status;
    if (data.localizacao !== undefined) exemplar.localizacao = data.localizacao;

    storageService.saveExemplares(exemplares);
    return { success: true, message: `Exemplar ${id_exemplar} atualizado com sucesso.` };
  }

  public deleteExemplar(id_exemplar: string, motivoBaixa?: string): { success: boolean; message: string } {
    const exemplares = storageService.getExemplares();
    const index = exemplares.findIndex((e) => e.id_exemplar === id_exemplar);
    if (index === -1) {
      return { success: false, message: 'Exemplar não encontrado.' };
    }

    const copy = exemplares[index];
    if (copy.status === 'Emprestado') {
      return { success: false, message: 'Não é possível dar baixa em exemplar atualmente emprestado.' };
    }

    // Register Baixa in audit log
    this.logAuditoria({
      id_exemplar,
      tipo_operacao: 'Baixa',
      usuario_sistema: this.getCurrentUsername(),
      detalhes: motivoBaixa || 'Baixa física do exemplar',
    });

    exemplares.splice(index, 1);
    storageService.saveExemplares(exemplares);

    // Update volume in Titulo
    const titulos = storageService.getTitulos();
    const titulo = titulos.find((t) => t.id_titulo === copy.id_titulo);
    if (titulo) {
      titulo.vol = exemplares.filter((e) => e.id_titulo === copy.id_titulo).length;
      storageService.saveTitulos(titulos);
    }

    return { success: true, message: `Exemplar ${id_exemplar} removido/baixado com sucesso.` };
  }

  // ==========================================
  // LEITOR CRUD
  // ==========================================
  public createLeitor(data: { nome_do_leitor: string; email: string; cpf?: string; telefone?: string }): { success: boolean; message: string; leitor?: Leitor } {
    if (!data.nome_do_leitor?.trim() || !data.email?.trim()) {
      return { success: false, message: 'Nome e E-mail são obrigatórios.' };
    }

    const leitores = storageService.getLeitores();

    // Check unique email
    if (leitores.some((l) => l.email.toLowerCase() === data.email.trim().toLowerCase())) {
      return { success: false, message: `Já existe um leitor cadastrado com o e-mail "${data.email}".` };
    }

    // Check unique CPF if provided
    if (data.cpf && data.cpf.trim()) {
      const cleanCpf = data.cpf.replace(/\D/g, '');
      const existsCpf = leitores.some((l) => l.cpf && l.cpf.replace(/\D/g, '') === cleanCpf);
      if (existsCpf) {
        return { success: false, message: `Já existe um leitor cadastrado com o CPF informado.` };
      }
    }

    const nextId = leitores.length > 0 ? Math.max(...leitores.map((l) => l.id_leitor)) + 1 : 101;

    const newLeitor: Leitor = {
      id_leitor: nextId,
      nome_do_leitor: data.nome_do_leitor.trim(),
      email: data.email.trim(),
      cpf: data.cpf?.trim(),
      telefone: data.telefone?.trim(),
      data_cadastro: new Date().toISOString().split('T')[0],
      bloqueado: false,
      created_at: new Date().toISOString(),
    };

    leitores.push(newLeitor);
    storageService.saveLeitores(leitores);

    return { success: true, message: `Leitor "${newLeitor.nome_do_leitor}" cadastrado com sucesso (ID: ${newLeitor.id_leitor}).`, leitor: newLeitor };
  }

  public updateLeitor(id_leitor: number, data: Partial<Omit<Leitor, 'id_leitor' | 'created_at'>>): { success: boolean; message: string } {
    const leitores = storageService.getLeitores();
    const index = leitores.findIndex((l) => l.id_leitor === id_leitor);
    if (index === -1) {
      return { success: false, message: 'Leitor não encontrado.' };
    }

    const current = leitores[index];

    // Check unique email if modified
    if (data.email && data.email.toLowerCase() !== current.email.toLowerCase()) {
      const existsEmail = leitores.some((l) => l.id_leitor !== id_leitor && l.email.toLowerCase() === data.email?.toLowerCase());
      if (existsEmail) {
        return { success: false, message: 'E-mail já utilizado por outro leitor.' };
      }
    }

    leitores[index] = {
      ...current,
      ...data,
      id_leitor: current.id_leitor,
    };

    storageService.saveLeitores(leitores);
    return { success: true, message: 'Dados do leitor atualizados com sucesso.' };
  }

  public deleteLeitor(id_leitor: number): { success: boolean; message: string } {
    // Check if leitor has active loans
    const emprestimos = storageService.getEmprestimos();
    const activeLoan = emprestimos.find((e) => e.id_leitor === id_leitor && !e.data_devolucao_real);
    if (activeLoan) {
      return { success: false, message: 'Não é possível excluir leitor com empréstimos ativos pendentes.' };
    }

    const leitores = storageService.getLeitores();
    const index = leitores.findIndex((l) => l.id_leitor === id_leitor);
    if (index === -1) {
      return { success: false, message: 'Leitor não encontrado.' };
    }

    leitores.splice(index, 1);
    storageService.saveLeitores(leitores);
    return { success: true, message: 'Leitor removido com sucesso.' };
  }

  // ==========================================
  // EMPRESTIMO & DEVOLUÇÃO (CIRCULAÇÃO)
  // ==========================================
  public realizeEmprestimo(id_exemplar: string, id_leitor: number, diasCustom?: number): { success: boolean; message: string; emprestimo?: Emprestimo } {
    const exemplares = storageService.getExemplares();
    const exemplar = exemplares.find((e) => e.id_exemplar === id_exemplar);
    if (!exemplar) {
      return { success: false, message: `Exemplar "${id_exemplar}" não foi encontrado.` };
    }

    if (exemplar.status !== 'Disponivel' && exemplar.status !== 'Reservado') {
      return { success: false, message: `Exemplar "${id_exemplar}" não está disponível para empréstimo (Status: ${exemplar.status}).` };
    }

    const leitores = storageService.getLeitores();
    const leitor = leitores.find((l) => l.id_leitor === id_leitor);
    if (!leitor) {
      return { success: false, message: `Leitor ID ${id_leitor} não encontrado.` };
    }

    if (leitor.bloqueado) {
      return {
        success: false,
        message: `Empréstimo bloqueado: O leitor ${leitor.nome_do_leitor} está com status BLOQUEADO (${leitor.motivo_bloqueio || 'pendências anteriores'}).`,
      };
    }

    // Check overdue loans for this reader
    const emprestimos = storageService.getEmprestimos();
    this.refreshOverdueStatus(); // Sync real-time
    const currentActiveLoans = emprestimos.filter((e) => e.id_leitor === id_leitor && !e.data_devolucao_real);
    const hasOverdue = currentActiveLoans.some((e) => e.atraso);

    if (hasOverdue) {
      if (this.isAutoBlockEnabled()) {
        leitor.bloqueado = true;
        leitor.motivo_bloqueio = 'Bloqueio automático devido a empréstimos em atraso';
        storageService.saveLeitores(leitores);
      }
      return {
        success: false,
        message: `Atenção: O leitor possui livros em ATRASO. Regularize as pendências antes de realizar novos empréstimos.`,
      };
    }

    // Check max limit
    const maxLoans = this.getMaxLoansPerReader();
    if (currentActiveLoans.length >= maxLoans) {
      return {
        success: false,
        message: `Limite de empréstimos atingido: O leitor já possui ${currentActiveLoans.length} livros em posse (máximo configurado: ${maxLoans}).`,
      };
    }

    // Check reservations queue
    if (exemplar.status === 'Reservado') {
      const reservas = storageService.getReservas();
      const activeReserva = reservas.find((r) => r.id_titulo === exemplar.id_titulo && r.status_reserva === 'Ativa');
      if (activeReserva && activeReserva.id_leitor !== id_leitor) {
        return {
          success: false,
          message: `Este exemplar está reservado para outro leitor na fila de espera (Leitor ID: ${activeReserva.id_leitor}).`,
        };
      }
    }

    const loanDays = diasCustom || this.getLoanDays();
    const dataEmprestimo = new Date();
    const dataPrevista = new Date(dataEmprestimo);
    dataPrevista.setDate(dataPrevista.getDate() + loanDays);

    const nextId = emprestimos.length > 0 ? Math.max(...emprestimos.map((e) => e.id_emprestimo)) + 1 : 1;

    const newEmprestimo: Emprestimo = {
      id_emprestimo: nextId,
      id_exemplar,
      id_leitor,
      data_emprestimo: dataEmprestimo.toISOString(),
      data_prevista_devolucao: dataPrevista.toISOString(),
      atraso: false,
      renovado: false,
      created_at: dataEmprestimo.toISOString(),
    };

    // Update exemplar status
    exemplar.status = 'Emprestado';
    storageService.saveExemplares(exemplares);

    // If there was a reservation for this reader, mark as fulfilled
    const reservas = storageService.getReservas();
    const matchingRes = reservas.find((r) => r.id_titulo === exemplar.id_titulo && r.id_leitor === id_leitor && r.status_reserva === 'Ativa');
    if (matchingRes) {
      matchingRes.status_reserva = 'Atendida';
      storageService.saveReservas(reservas);
    }

    emprestimos.unshift(newEmprestimo);
    storageService.saveEmprestimos(emprestimos);

    this.logAuditoria({
      id_exemplar,
      id_leitor,
      tipo_operacao: 'Retirada',
      usuario_sistema: this.getCurrentUsername(),
      detalhes: `Retirada confirmada com prazo de ${loanDays} dias (Devolução prevista: ${dataPrevista.toLocaleDateString('pt-BR')})`,
    });

    return {
      success: true,
      message: `Empréstimo #${nextId} registrado com sucesso para ${leitor.nome_do_leitor}. Prazo: ${dataPrevista.toLocaleDateString('pt-BR')}.`,
      emprestimo: newEmprestimo,
    };
  }

  public realizeDevolucao(id_exemplar: string): { success: boolean; message: string; diasAtraso: number; reservaAtendida?: boolean; proximoLeitorReserva?: string } {
    const emprestimos = storageService.getEmprestimos();
    const emprestimo = emprestimos.find((e) => e.id_exemplar === id_exemplar && !e.data_devolucao_real);

    if (!emprestimo) {
      return { success: false, message: `Não foi encontrado nenhum empréstimo ativo para o exemplar "${id_exemplar}".`, diasAtraso: 0 };
    }

    const now = new Date();
    const dataPrevista = new Date(emprestimo.data_prevista_devolucao);
    const diffTime = now.getTime() - dataPrevista.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diasAtraso = diffDays > 0 ? diffDays : 0;

    emprestimo.data_devolucao_real = now.toISOString();
    emprestimo.atraso = diasAtraso > 0;
    emprestimo.dias_atraso = diasAtraso;
    storageService.saveEmprestimos(emprestimos);

    const exemplares = storageService.getExemplares();
    const exemplar = exemplares.find((e) => e.id_exemplar === id_exemplar);

    let reservaAtendida = false;
    let proximoLeitorReserva: string | undefined = undefined;

    if (exemplar) {
      // Check if there is an active reservation for this title!
      const reservas = storageService.getReservas();
      const activeReserva = reservas
        .filter((r) => r.id_titulo === exemplar.id_titulo && r.status_reserva === 'Ativa')
        .sort((a, b) => new Date(a.data_reserva).getTime() - new Date(b.data_reserva).getTime())[0];

      if (activeReserva) {
        exemplar.status = 'Reservado';
        reservaAtendida = true;
        const leitorRes = storageService.getLeitores().find((l) => l.id_leitor === activeReserva.id_leitor);
        proximoLeitorReserva = leitorRes ? leitorRes.nome_do_leitor : `Leitor #${activeReserva.id_leitor}`;
      } else {
        exemplar.status = 'Disponivel';
      }
      storageService.saveExemplares(exemplares);
    }

    // Auto unblock reader if no other overdue loans exist
    const readerActiveOverdue = emprestimos.some((e) => e.id_leitor === emprestimo.id_leitor && !e.data_devolucao_real && e.atraso);
    if (!readerActiveOverdue) {
      const leitores = storageService.getLeitores();
      const leitor = leitores.find((l) => l.id_leitor === emprestimo.id_leitor);
      if (leitor && leitor.bloqueado && leitor.motivo_bloqueio?.includes('automático')) {
        leitor.bloqueado = false;
        leitor.motivo_bloqueio = undefined;
        storageService.saveLeitores(leitores);
      }
    }

    this.logAuditoria({
      id_exemplar,
      id_leitor: emprestimo.id_leitor,
      tipo_operacao: 'Devolucao',
      usuario_sistema: this.getCurrentUsername(),
      detalhes: diasAtraso > 0 ? `Devolvido com ${diasAtraso} dia(s) de atraso` : 'Devolvido pontualmente',
    });

    let msg = `Devolução do exemplar ${id_exemplar} realizada com sucesso.`;
    if (diasAtraso > 0) {
      msg += ` Constatado atraso de ${diasAtraso} dia(s).`;
    }
    if (reservaAtendida) {
      msg += ` ATENÇÃO: O exemplar foi colocado em status RESERVADO para o leitor da fila (${proximoLeitorReserva}).`;
    }

    return {
      success: true,
      message: msg,
      diasAtraso,
      reservaAtendida,
      proximoLeitorReserva,
    };
  }

  public renovarEmprestimo(id_emprestimo: number): { success: boolean; message: string } {
    const emprestimos = storageService.getEmprestimos();
    const emprestimo = emprestimos.find((e) => e.id_emprestimo === id_emprestimo);
    if (!emprestimo) {
      return { success: false, message: 'Empréstimo não encontrado.' };
    }

    if (emprestimo.data_devolucao_real) {
      return { success: false, message: 'Não é possível renovar um empréstimo já finalizado.' };
    }

    // Rule: Single renewal permitted
    const maxRenov = parseInt(this.getParam('max_renovacoes_permitidas', '1'), 10) || 1;
    if (emprestimo.renovado && maxRenov <= 1) {
      return { success: false, message: 'Este empréstimo já foi renovado. A política da biblioteca permite apenas uma única renovação.' };
    }

    // Rule: Cannot renew if there is an active reservation for the title!
    const exemplares = storageService.getExemplares();
    const exemplar = exemplares.find((e) => e.id_exemplar === emprestimo.id_exemplar);
    if (exemplar) {
      const reservas = storageService.getReservas();
      const hasReservation = reservas.some((r) => r.id_titulo === exemplar.id_titulo && r.status_reserva === 'Ativa');
      if (hasReservation) {
        return {
          success: false,
          message: 'Renovação bloqueada: Existem leitores aguardando na fila de reserva para este título.',
        };
      }
    }

    const loanDays = this.getLoanDays();
    const currentPrevista = new Date(emprestimo.data_prevista_devolucao);
    const newPrevista = new Date(currentPrevista);
    newPrevista.setDate(newPrevista.getDate() + loanDays);

    emprestimo.data_prevista_devolucao = newPrevista.toISOString();
    emprestimo.renovado = true;
    emprestimo.atraso = false;
    emprestimo.dias_atraso = 0;
    storageService.saveEmprestimos(emprestimos);

    this.logAuditoria({
      id_exemplar: emprestimo.id_exemplar,
      id_leitor: emprestimo.id_leitor,
      tipo_operacao: 'Renovacao',
      usuario_sistema: this.getCurrentUsername(),
      detalhes: `Renovação por mais ${loanDays} dias. Nova data prevista: ${newPrevista.toLocaleDateString('pt-BR')}`,
    });

    return {
      success: true,
      message: `Empréstimo renovado com sucesso! Nova data prevista: ${newPrevista.toLocaleDateString('pt-BR')}.`,
    };
  }

  // ==========================================
  // RESERVAS
  // ==========================================
  public createReserva(id_titulo: string, id_leitor: number, observacoes?: string): { success: boolean; message: string; reserva?: Reserva } {
    const titulos = storageService.getTitulos();
    const titulo = titulos.find((t) => t.id_titulo === id_titulo && t.ativo);
    if (!titulo) {
      return { success: false, message: 'Título não encontrado ou inativo.' };
    }

    const leitores = storageService.getLeitores();
    const leitor = leitores.find((l) => l.id_leitor === id_leitor);
    if (!leitor) {
      return { success: false, message: 'Leitor não encontrado.' };
    }

    if (leitor.bloqueado) {
      return { success: false, message: 'Leitor com cadastro bloqueado não pode solicitar reservas.' };
    }

    const reservas = storageService.getReservas();
    const alreadyReserved = reservas.some(
      (r) => r.id_titulo === id_titulo && r.id_leitor === id_leitor && r.status_reserva === 'Ativa'
    );
    if (alreadyReserved) {
      return { success: false, message: 'Você já possui uma reserva ativa para esta obra.' };
    }

    const nextId = reservas.length > 0 ? Math.max(...reservas.map((r) => r.id_reserva)) + 1 : 1;
    const newReserva: Reserva = {
      id_reserva: nextId,
      id_titulo,
      id_leitor,
      data_reserva: new Date().toISOString(),
      status_reserva: 'Ativa',
      observacoes: observacoes?.trim(),
      created_at: new Date().toISOString(),
    };

    reservas.push(newReserva);
    storageService.saveReservas(reservas);

    this.logAuditoria({
      id_exemplar: `${id_titulo}-reserva`,
      id_leitor,
      tipo_operacao: 'Reserva',
      usuario_sistema: this.getCurrentUsername(),
      detalhes: `Reserva #${nextId} cadastrada para a obra "${titulo.titulo_de_livro}"`,
    });

    return {
      success: true,
      message: `Reserva registrada com sucesso na fila de espera para "${titulo.titulo_de_livro}".`,
      reserva: newReserva,
    };
  }

  public updateReservaStatus(id_reserva: number, status_reserva: Reserva['status_reserva']): { success: boolean; message: string } {
    const reservas = storageService.getReservas();
    const reserva = reservas.find((r) => r.id_reserva === id_reserva);
    if (!reserva) {
      return { success: false, message: 'Reserva não encontrada.' };
    }

    reserva.status_reserva = status_reserva;
    storageService.saveReservas(reservas);
    return { success: true, message: `Status da reserva #${id_reserva} alterado para "${status_reserva}".` };
  }

  public deleteReserva(id_reserva: number): { success: boolean; message: string } {
    const reservas = storageService.getReservas();
    const index = reservas.findIndex((r) => r.id_reserva === id_reserva);
    if (index === -1) {
      return { success: false, message: 'Reserva não encontrada.' };
    }

    reservas.splice(index, 1);
    storageService.saveReservas(reservas);
    return { success: true, message: `Reserva #${id_reserva} cancelada/excluída com sucesso.` };
  }

  // ==========================================
  // AUDIT LOG (IMUTÁVEL)
  // ==========================================
  public logAuditoria(log: Omit<HistoricoMovimentacao, 'id_log' | 'data_hora'>): void {
    const historico = storageService.getHistorico();
    const nextId = historico.length > 0 ? Math.max(...historico.map((h) => h.id_log)) + 1 : 1;
    const newLog: HistoricoMovimentacao = {
      id_log: nextId,
      id_exemplar: log.id_exemplar,
      id_leitor: log.id_leitor,
      tipo_operacao: log.tipo_operacao,
      data_hora: new Date().toISOString(),
      usuario_sistema: log.usuario_sistema || 'sistema',
      detalhes: log.detalhes,
    };

    historico.unshift(newLog);
    storageService.saveHistorico(historico);
  }

  // ==========================================
  // REAL-TIME SYNC & CALCULATION
  // ==========================================
  public checkAndMarkOverdueLoans(): void {
    this.refreshOverdueStatus();
  }

  public refreshOverdueStatus(): void {
    const emprestimos = storageService.getEmprestimos();
    const now = new Date();
    let changed = false;

    emprestimos.forEach((emp) => {
      if (!emp.data_devolucao_real) {
        const prev = new Date(emp.data_prevista_devolucao);
        if (now > prev) {
          const diff = Math.ceil((now.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
          if (!emp.atraso || emp.dias_atraso !== diff) {
            emp.atraso = true;
            emp.dias_atraso = diff;
            changed = true;
          }
        } else {
          if (emp.atraso) {
            emp.atraso = false;
            emp.dias_atraso = 0;
            changed = true;
          }
        }
      }
    });

    if (changed) {
      storageService.saveEmprestimos(emprestimos);
    }
  }

  // ==========================================
  // AUTH & CURRENT USER
  // ==========================================
  public getCurrentUser(): UsuarioSistema {
    return storageService.getCurrentUser();
  }

  public getCurrentUsername(): string {
    const user = this.getCurrentUser();
    return user ? (user.username || user.login || 'operador') : 'operador';
  }

  public hasPermission(requiredRole: PerfilUsuario[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return requiredRole.includes(user.perfil);
  }
}

export const libraryService = new LibraryService();
