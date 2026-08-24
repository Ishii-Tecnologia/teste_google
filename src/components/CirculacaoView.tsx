import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  User,
  Barcode,
  Calendar,
  UserPlus,
  FileText,
  Printer,
  ShieldAlert,
} from 'lucide-react';
import { Emprestimo, Exemplar, Titulo, Leitor, Reserva } from '../types';
import { libraryService } from '../services/libraryService';

interface CirculacaoViewProps {
  emprestimos: Emprestimo[];
  exemplares: Exemplar[];
  titulos: Titulo[];
  leitores: Leitor[];
  reservas: Reserva[];
  onRefresh: () => void;
  onOpenReceipt: (receiptData: {
    type: 'emprestimo' | 'devolucao';
    emprestimo: Emprestimo;
    titulo: Titulo;
    exemplar: Exemplar;
    leitor: Leitor;
    diasAtraso?: number;
  }) => void;
  initialSelectedExemplarId?: string | null;
}

export const CirculacaoView: React.FC<CirculacaoViewProps> = ({
  emprestimos,
  exemplares,
  titulos,
  leitores,
  reservas,
  onRefresh,
  onOpenReceipt,
  initialSelectedExemplarId,
}) => {
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'RETURNED'>('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');

  // Loan Modal
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [loanExemplarId, setLoanExemplarId] = useState(initialSelectedExemplarId || '');
  const [loanLeitorId, setLoanLeitorId] = useState<number | ''>('');
  const [loanCustomDays, setLoanCustomDays] = useState<number>(15);
  const [loanError, setLoanError] = useState<string | null>(null);

  // Rapid Reader Registration sub-modal
  const [isRapidReaderOpen, setIsRapidReaderOpen] = useState(false);
  const [rapidNome, setRapidNome] = useState('');
  const [rapidEmail, setRapidEmail] = useState('');
  const [rapidCpf, setRapidCpf] = useState('');
  const [rapidTelefone, setRapidTelefone] = useState('');
  const [rapidError, setRapidError] = useState<string | null>(null);

  // Return confirmation modal
  const [returnExemplarId, setReturnExemplarId] = useState<string | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Feedback banner
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Sync initial exemplar selection if navigated with a specific exemplar ID
  useEffect(() => {
    if (initialSelectedExemplarId) {
      const ex = exemplares.find((e) => e.id_exemplar.toUpperCase() === initialSelectedExemplarId.toUpperCase());
      if (ex && ex.status === 'Emprestado') {
        setReturnExemplarId(ex.id_exemplar);
        setIsReturnModalOpen(true);
      } else {
        setLoanExemplarId(initialSelectedExemplarId);
        setIsLoanModalOpen(true);
      }
    }
  }, [initialSelectedExemplarId, exemplares]);

  // Loan days parameter from settings
  const defaultLoanDays = libraryService.getLoanDays();

  // Traffic light status helper
  const getTrafficStatus = (emp: Emprestimo) => {
    if (emp.data_devolucao_real) {
      return {
        label: 'Devolvido',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        badge: 'Devolvido',
      };
    }

    if (emp.atraso) {
      return {
        label: `Atrasado (${emp.dias_atraso}d)`,
        color: 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse',
        dot: 'bg-rose-600',
        badge: 'Vermelho • Em Atraso',
      };
    }

    const now = new Date();
    const prev = new Date(emp.data_prevista_devolucao);
    const diffDays = Math.ceil((prev.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 2) {
      return {
        label: `Vence em ${diffDays}d`,
        color: 'bg-amber-50 text-amber-900 border-amber-300',
        dot: 'bg-amber-500',
        badge: 'Amarelo • Vencendo',
      };
    }

    return {
      label: 'Em Dia (No Prazo)',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-500',
      badge: 'Verde • No Prazo',
    };
  };

  // Filtered loans
  const filteredEmprestimos = emprestimos.filter((emp) => {
    if (activeTabFilter === 'ACTIVE' && emp.data_devolucao_real) return false;
    if (activeTabFilter === 'OVERDUE' && (!emp.atraso || emp.data_devolucao_real)) return false;
    if (activeTabFilter === 'RETURNED' && !emp.data_devolucao_real) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const exemplar = exemplares.find((e) => e.id_exemplar === emp.id_exemplar);
      const titulo = exemplar ? titulos.find((t) => t.id_titulo === exemplar.id_titulo) : null;
      const leitor = leitores.find((l) => l.id_leitor === emp.id_leitor);

      const matchEx = emp.id_exemplar.toLowerCase().includes(term);
      const matchTitle = titulo?.titulo_de_livro.toLowerCase().includes(term) || false;
      const matchLeitor = leitor?.nome_do_leitor.toLowerCase().includes(term) || false;
      const matchCpf = leitor?.cpf?.toLowerCase().includes(term) || false;
      return matchEx || matchTitle || matchLeitor || matchCpf;
    }
    return true;
  });

  // Open Loan Modal
  const handleOpenLoanModal = (prefillExemplar?: string) => {
    setLoanExemplarId(prefillExemplar || '');
    setLoanLeitorId('');
    setLoanCustomDays(defaultLoanDays);
    setLoanError(null);
    setIsLoanModalOpen(true);
  };

  // Rapid Reader Submit
  const handleRapidReaderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRapidError(null);

    const res = libraryService.createLeitor({
      nome_do_leitor: rapidNome,
      email: rapidEmail,
      cpf: rapidCpf || undefined,
      telefone: rapidTelefone || undefined,
    });

    if (!res.success || !res.leitor) {
      setRapidError(res.message);
      return;
    }

    onRefresh();
    setLoanLeitorId(res.leitor.id_leitor);
    setIsRapidReaderOpen(false);
    setRapidNome('');
    setRapidEmail('');
    setRapidCpf('');
    setRapidTelefone('');
  };

  // Submit Loan
  const handleConfirmLoan = (e: React.FormEvent) => {
    e.preventDefault();
    setLoanError(null);

    if (!loanExemplarId.trim()) {
      setLoanError('Selecione ou bipe o ID do exemplar físico.');
      return;
    }

    if (!loanLeitorId) {
      setLoanError('Selecione o leitor cadastrado ou utilize o botão "Cadastro Rápido".');
      return;
    }

    const res = libraryService.realizeEmprestimo(loanExemplarId.trim().toUpperCase(), Number(loanLeitorId), loanCustomDays);
    if (!res.success) {
      setLoanError(res.message);
      return;
    }

    setIsLoanModalOpen(false);
    onRefresh();
    setFeedbackMessage({ type: 'success', text: res.message });

    // Open receipt modal automatically
    if (res.emprestimo) {
      const exemplar = exemplares.find((e) => e.id_exemplar === res.emprestimo!.id_exemplar);
      const titulo = exemplar ? titulos.find((t) => t.id_titulo === exemplar.id_titulo) : null;
      const leitor = leitores.find((l) => l.id_leitor === res.emprestimo!.id_leitor);
      if (exemplar && titulo && leitor) {
        onOpenReceipt({
          type: 'emprestimo',
          emprestimo: res.emprestimo,
          titulo,
          exemplar,
          leitor,
        });
      }
    }

    setTimeout(() => setFeedbackMessage(null), 6000);
  };

  // Renew Loan
  const handleRenovate = (id_emprestimo: number) => {
    const res = libraryService.renovarEmprestimo(id_emprestimo);
    if (!res.success) {
      alert(`Renovação impedida: ${res.message}`);
    } else {
      setFeedbackMessage({ type: 'success', text: res.message });
      onRefresh();
      setTimeout(() => setFeedbackMessage(null), 5000);
    }
  };

  // Open Return Confirmation
  const handleOpenReturnModal = (exemplarId: string) => {
    setReturnExemplarId(exemplarId);
    setIsReturnModalOpen(true);
  };

  // Confirm Return
  const handleConfirmReturn = () => {
    if (!returnExemplarId) return;

    const emp = emprestimos.find((e) => e.id_exemplar === returnExemplarId && !e.data_devolucao_real);
    const res = libraryService.realizeDevolucao(returnExemplarId);

    setIsReturnModalOpen(false);
    onRefresh();

    if (!res.success) {
      alert(res.message);
      return;
    }

    setFeedbackMessage({
      type: res.diasAtraso > 0 ? 'warning' : 'success',
      text: res.message,
    });

    if (emp) {
      const exemplar = exemplares.find((e) => e.id_exemplar === emp.id_exemplar);
      const titulo = exemplar ? titulos.find((t) => t.id_titulo === exemplar.id_titulo) : null;
      const leitor = leitores.find((l) => l.id_leitor === emp.id_leitor);
      if (exemplar && titulo && leitor) {
        onOpenReceipt({
          type: 'devolucao',
          emprestimo: emp,
          titulo,
          exemplar,
          leitor,
          diasAtraso: res.diasAtraso,
        });
      }
    }

    setTimeout(() => setFeedbackMessage(null), 7000);
  };

  // Available Exemplares list for dropdown
  const availableExemplares = exemplares.filter((e) => e.status === 'Disponivel' || e.status === 'Reservado');

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-600" />
            Módulo de Circulação (Empréstimos, Devoluções e Renovações)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de prazos (padrão 15 dias), renovação única, semáforo de status (Verde/Amarelo/Vermelho) e emissão de comprovantes.
          </p>
        </div>

        <button
          id="btn-circulacao-novo"
          onClick={() => handleOpenLoanModal()}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Realizar Novo Empréstimo
        </button>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-150 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : feedbackMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="font-bold text-xs">
            ×
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            id="input-search-circulacao"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código de exemplar (ex: CX001-1), leitor, CPF ou título..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50 uppercase"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Tab Buttons */}
        <div className="flex rounded-lg border border-slate-300 overflow-hidden text-xs">
          <button
            onClick={() => setActiveTabFilter('ACTIVE')}
            className={`px-3 py-1.5 ${
              activeTabFilter === 'ACTIVE'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Em Andamento ({emprestimos.filter((e) => !e.data_devolucao_real).length})
          </button>
          <button
            onClick={() => setActiveTabFilter('OVERDUE')}
            className={`px-3 py-1.5 ${
              activeTabFilter === 'OVERDUE'
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-white text-rose-700 hover:bg-rose-50'
            }`}
          >
            Em Atraso ({emprestimos.filter((e) => !e.data_devolucao_real && e.atraso).length})
          </button>
          <button
            onClick={() => setActiveTabFilter('RETURNED')}
            className={`px-3 py-1.5 ${
              activeTabFilter === 'RETURNED'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Devolvidos ({emprestimos.filter((e) => e.data_devolucao_real).length})
          </button>
          <button
            onClick={() => setActiveTabFilter('ALL')}
            className={`px-3 py-1.5 ${
              activeTabFilter === 'ALL'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos ({emprestimos.length})
          </button>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Indicador</th>
                <th className="py-3 px-4">Exemplar / Título</th>
                <th className="py-3 px-4">Leitor / CPF</th>
                <th className="py-3 px-4">Data Retirada</th>
                <th className="py-3 px-4">Prazo Previsto</th>
                <th className="py-3 px-4">Devolução / Atraso</th>
                <th className="py-3 px-4 text-right">Ações Operacionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredEmprestimos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum registro de movimentação de empréstimo encontrado.
                  </td>
                </tr>
              ) : (
                filteredEmprestimos.map((emp) => {
                  const exemplar = exemplares.find((e) => e.id_exemplar === emp.id_exemplar);
                  const titulo = exemplar ? titulos.find((t) => t.id_titulo === exemplar.id_titulo) : null;
                  const leitor = leitores.find((l) => l.id_leitor === emp.id_leitor);
                  const status = getTrafficStatus(emp);
                  const isReturned = !!emp.data_devolucao_real;

                  return (
                    <tr key={emp.id_emprestimo} className="hover:bg-slate-50/70 transition-colors">
                      {/* Semáforo Visual */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-3 h-3 rounded-full ${status.dot} shrink-0`} />
                          <span className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </td>

                      {/* Exemplar / Obra */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 leading-tight">
                          {titulo?.titulo_de_livro || emp.id_exemplar}
                        </p>
                        <p className="text-2xs text-slate-500 mt-0.5">
                          Cód. Exemplar: <span className="font-mono font-bold text-indigo-700">{emp.id_exemplar}</span>
                          {titulo?.autor && ` • ${titulo.autor}`}
                        </p>
                      </td>

                      {/* Leitor */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 leading-tight">
                          {leitor?.nome_do_leitor || `Leitor ID #${emp.id_leitor}`}
                        </p>
                        <p className="text-2xs text-slate-500 font-mono">
                          {leitor?.cpf ? `CPF: ${leitor.cpf}` : `ID: ${emp.id_leitor}`}
                        </p>
                      </td>

                      {/* Data Empréstimo */}
                      <td className="py-3 px-4 font-mono text-2xs text-slate-600">
                        {new Date(emp.data_emprestimo).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Previsão de Devolução */}
                      <td className="py-3 px-4 font-mono text-2xs">
                        <span className={`font-bold ${emp.atraso ? 'text-rose-700' : 'text-slate-800'}`}>
                          {new Date(emp.data_prevista_devolucao).toLocaleDateString('pt-BR')}
                        </span>
                        {emp.renovado && (
                          <span className="block text-2xs text-indigo-600 font-sans font-medium">
                            (Renovado 1x)
                          </span>
                        )}
                      </td>

                      {/* Devolução Real / Atraso */}
                      <td className="py-3 px-4 text-2xs">
                        {isReturned ? (
                          <div>
                            <span className="text-emerald-700 font-semibold">
                              Devolvido em {new Date(emp.data_devolucao_real!).toLocaleDateString('pt-BR')}
                            </span>
                            {emp.dias_atraso ? (
                              <p className="text-rose-600">({emp.dias_atraso}d de atraso)</p>
                            ) : (
                              <p className="text-slate-400">Pontual</p>
                            )}
                          </div>
                        ) : emp.atraso ? (
                          <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block">
                            {emp.dias_atraso} dia(s) em atraso
                          </span>
                        ) : (
                          <span className="text-slate-500">Aguardando devolução</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isReturned ? (
                            <>
                              {/* Devolver */}
                              <button
                                id={`btn-return-${emp.id_emprestimo}`}
                                onClick={() => handleOpenReturnModal(emp.id_exemplar)}
                                className="px-2.5 py-1 text-2xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1"
                                title="Registrar devolução física"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Devolver
                              </button>

                              {/* Renovar */}
                              <button
                                id={`btn-renew-${emp.id_emprestimo}`}
                                onClick={() => handleRenovate(emp.id_emprestimo)}
                                disabled={emp.renovado}
                                className={`p-1.5 rounded-lg border text-2xs transition-colors flex items-center gap-1 ${
                                  emp.renovado
                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-white border-slate-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300'
                                }`}
                                title={emp.renovado ? 'Limite de 1 renovação atingido' : 'Renovar por mais 15 dias'}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                if (exemplar && titulo && leitor) {
                                  onOpenReceipt({
                                    type: 'devolucao',
                                    emprestimo: emp,
                                    titulo,
                                    exemplar,
                                    leitor,
                                    diasAtraso: emp.dias_atraso,
                                  });
                                }
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 bg-white hover:bg-indigo-50 transition-colors"
                              title="Reimprimir comprovante de devolução"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO EMPRÉSTIMO COM SUPORTE A CADASTRO RÁPIDO */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Repeat className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Realizar Empréstimo de Livro</h3>
              </div>
              <button
                onClick={() => setIsLoanModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmLoan} className="p-6 space-y-4">
              {loanError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{loanError}</span>
                </div>
              )}

              {/* 1. Seleção / Leitura do Exemplar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Exemplar Físico (Código de Barras / ID Único) <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={loanExemplarId}
                    onChange={(e) => setLoanExemplarId(e.target.value.toUpperCase())}
                    placeholder="Ex: CX001-1 ou bipe o código..."
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 uppercase bg-slate-50"
                  />
                  <select
                    onChange={(e) => {
                      if (e.target.value) setLoanExemplarId(e.target.value);
                    }}
                    className="px-2 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">-- Selecionar da lista ({availableExemplares.length}) --</option>
                    {availableExemplares.map((ex) => {
                      const t = titulos.find((tit) => tit.id_titulo === ex.id_titulo);
                      return (
                        <option key={ex.id_exemplar} value={ex.id_exemplar}>
                          {ex.id_exemplar} — {t?.titulo_de_livro} ({ex.status})
                        </option>
                      );
                    })}
                  </select>
                </div>
                {loanExemplarId && (
                  <div className="mt-1.5 p-2 rounded bg-slate-50 text-2xs text-slate-600 border border-slate-200">
                    {(() => {
                      const ex = exemplares.find((e) => e.id_exemplar.toUpperCase() === loanExemplarId.toUpperCase());
                      if (!ex) return <span className="text-rose-600 font-semibold">Exemplar não localizado.</span>;
                      const tit = titulos.find((t) => t.id_titulo === ex.id_titulo);
                      return (
                        <span>
                          Obra: <strong>{tit?.titulo_de_livro}</strong> ({tit?.autor}) • Status: <strong>{ex.status}</strong> • Local: {ex.localizacao}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* 2. Seleção do Leitor */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    2. Identificação do Leitor / Usuário <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsRapidReaderOpen(true)}
                    className="text-2xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> + Cadastro Rápido de Leitor
                  </button>
                </div>

                <select
                  required
                  value={loanLeitorId}
                  onChange={(e) => setLoanLeitorId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Selecione o Leitor Cadastrado --</option>
                  {leitores.map((l) => (
                    <option key={l.id_leitor} value={l.id_leitor} disabled={l.bloqueado}>
                      {l.nome_do_leitor} {l.cpf ? `(CPF: ${l.cpf})` : ''} {l.bloqueado ? '— [BLOQUEADO]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Prazo do Empréstimo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Prazo de Devolução (em dias corridos)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={loanCustomDays}
                    onChange={(e) => setLoanCustomDays(parseInt(e.target.value, 10) || 15)}
                    className="w-28 px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-500">
                    Previsão de devolução:{' '}
                    <strong className="text-slate-800 font-mono">
                      {(() => {
                        const d = new Date();
                        d.setDate(d.getDate() + loanCustomDays);
                        return d.toLocaleDateString('pt-BR');
                      })()}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Empréstimo & Emitir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: CADASTRO RÁPIDO DE LEITOR NO ATO DO EMPRÉSTIMO */}
      {isRapidReaderOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-300" />
                <h4 className="text-sm font-bold">Cadastro Rápido de Leitor (No Ato)</h4>
              </div>
              <button
                onClick={() => setIsRapidReaderOpen(false)}
                className="text-slate-300 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRapidReaderSubmit} className="p-5 space-y-3">
              {rapidError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {rapidError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rapidNome}
                  onChange={(e) => setRapidNome(e.target.value)}
                  placeholder="Nome do leitor"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={rapidEmail}
                  onChange={(e) => setRapidEmail(e.target.value)}
                  placeholder="leitor@email.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CPF (Opcional)</label>
                  <input
                    type="text"
                    value={rapidCpf}
                    onChange={(e) => setRapidCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={rapidTelefone}
                    onChange={(e) => setRapidTelefone(e.target.value)}
                    placeholder="(61) 90000-0000"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRapidReaderOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Salvar e Selecionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE DEVOLUÇÃO COM CÁLCULO DE DIAS DE ATRASO */}
      {isReturnModalOpen && returnExemplarId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold">Confirmar Devolução do Livro</h4>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Você está registrando o retorno físico do exemplar:
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                <span className="font-bold text-indigo-700 text-sm">{returnExemplarId}</span>
                {(() => {
                  const emp = emprestimos.find((e) => e.id_exemplar === returnExemplarId && !e.data_devolucao_real);
                  const leitor = emp ? leitores.find((l) => l.id_leitor === emp.id_leitor) : null;
                  const ex = exemplares.find((e) => e.id_exemplar === returnExemplarId);
                  const tit = ex ? titulos.find((t) => t.id_titulo === ex.id_titulo) : null;

                  return (
                    <div className="mt-1 text-slate-700 font-sans">
                      <p className="font-semibold">{tit?.titulo_de_livro}</p>
                      <p className="text-slate-500">Leitor: {leitor?.nome_do_leitor}</p>
                      {emp?.atraso && (
                        <p className="text-rose-600 font-bold mt-1">
                          ⚠️ Empréstimo em atraso ({emp.dias_atraso} dias)!
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              <p className="text-2xs text-slate-500">
                O sistema calculará automaticamente os dias de atraso (se houver), devolverá o status do exemplar para Disponível (ou Reservado caso haja leitor na fila) e atualizará a auditoria.
              </p>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReturn}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Devolução
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
