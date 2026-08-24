import React, { useState } from 'react';
import {
  Bookmark,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  BookOpen,
  Trash2,
  Edit2,
  ArrowRight,
} from 'lucide-react';
import { Reserva, Titulo, Leitor, Exemplar, StatusReserva } from '../types';
import { libraryService } from '../services/libraryService';

interface ReservasViewProps {
  reservas: Reserva[];
  titulos: Titulo[];
  leitores: Leitor[];
  exemplares: Exemplar[];
  onRefresh: () => void;
  onConvertReservaToLoan: (id_titulo: string, id_leitor: number) => void;
}

export const ReservasView: React.FC<ReservasViewProps> = ({
  reservas,
  titulos,
  leitores,
  exemplares,
  onRefresh,
  onConvertReservaToLoan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Ativa');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTitleId, setSelectedTitleId] = useState<string>(titulos[0]?.id_titulo || '');
  const [selectedLeitorId, setSelectedLeitorId] = useState<number | ''>('');
  const [observacoes, setObservacoes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtered reservations
  const filteredReservas = reservas.filter((r) => {
    if (statusFilter !== 'ALL' && r.status_reserva !== statusFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const titulo = titulos.find((t) => t.id_titulo === r.id_titulo);
      const leitor = leitores.find((l) => l.id_leitor === r.id_leitor);

      const matchTitle = titulo?.titulo_de_livro.toLowerCase().includes(term) || false;
      const matchAuthor = titulo?.autor.toLowerCase().includes(term) || false;
      const matchLeitor = leitor?.nome_do_leitor.toLowerCase().includes(term) || false;
      const matchId = r.id_titulo.toLowerCase().includes(term);
      return matchTitle || matchAuthor || matchLeitor || matchId;
    }
    return true;
  });

  const getStatusBadge = (status: StatusReserva) => {
    switch (status) {
      case 'Ativa':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3" /> Fila Ativa
          </span>
        );
      case 'Atendida':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Atendida (Retirado)
          </span>
        );
      case 'Cancelada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-500 border border-slate-300">
            <XCircle className="w-3 h-3" /> Cancelada
          </span>
        );
      case 'Expirada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Clock className="w-3 h-3" /> Expirada
          </span>
        );
    }
  };

  const handleOpenCreate = () => {
    setSelectedTitleId(titulos[0]?.id_titulo || '');
    setSelectedLeitorId('');
    setObservacoes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedTitleId) {
      setFormError('Selecione uma obra intelectual para reservar.');
      return;
    }

    if (!selectedLeitorId) {
      setFormError('Selecione um leitor cadastrado.');
      return;
    }

    const res = libraryService.createReserva(selectedTitleId, Number(selectedLeitorId), observacoes);
    if (!res.success) {
      setFormError(res.message);
      return;
    }

    setIsModalOpen(false);
    onRefresh();
    setFeedbackMessage({ type: 'success', text: res.message });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleCancelReserva = (id_reserva: number) => {
    if (!window.confirm('Deseja cancelar esta reserva?')) return;
    const res = libraryService.updateReservaStatus(id_reserva, 'Cancelada');
    if (!res.success) {
      alert(res.message);
    } else {
      setFeedbackMessage({ type: 'success', text: res.message });
      onRefresh();
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleDeleteReserva = (id_reserva: number) => {
    if (!window.confirm('Excluir permanentemente este registro de reserva?')) return;
    const res = libraryService.deleteReserva(id_reserva);
    if (!res.success) {
      alert(res.message);
    } else {
      setFeedbackMessage({ type: 'success', text: res.message });
      onRefresh();
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-600" />
            Fila de Espera de Obras & Reservas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento cronológico de leitores na fila de espera. Ao devolver um exemplar, o sistema reserva automaticamente para o primeiro leitor.
          </p>
        </div>

        <button
          id="btn-add-reserva"
          onClick={handleOpenCreate}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Registrar Nova Reserva
        </button>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-150 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="font-bold text-xs">
            ×
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            id="input-search-reservas"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, autor, código ou nome do leitor..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex rounded-lg border border-slate-300 overflow-hidden text-xs">
          <button
            onClick={() => setStatusFilter('Ativa')}
            className={`px-3 py-1.5 ${
              statusFilter === 'Ativa'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Fila Ativa ({reservas.filter((r) => r.status_reserva === 'Ativa').length})
          </button>
          <button
            onClick={() => setStatusFilter('Atendida')}
            className={`px-3 py-1.5 ${
              statusFilter === 'Atendida'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Atendidas ({reservas.filter((r) => r.status_reserva === 'Atendida').length})
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todas ({reservas.length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4"># / Data Solicitação</th>
                <th className="py-3 px-4">Obra Reservada (Título)</th>
                <th className="py-3 px-4">Leitor Solicitante</th>
                <th className="py-3 px-4">Disponibilidade Atual</th>
                <th className="py-3 px-4">Status da Reserva</th>
                <th className="py-3 px-4">Observações</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredReservas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhuma reserva na fila para este filtro.
                  </td>
                </tr>
              ) : (
                filteredReservas.map((r) => {
                  const titulo = titulos.find((t) => t.id_titulo === r.id_titulo);
                  const leitor = leitores.find((l) => l.id_leitor === r.id_leitor);
                  const copies = exemplares.filter((e) => e.id_titulo === r.id_titulo);
                  const hasReadyCopy = copies.some((e) => e.status === 'Reservado' || e.status === 'Disponivel');

                  return (
                    <tr key={r.id_reserva} className="hover:bg-slate-50/70 transition-colors">
                      {/* ID / Data */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{r.id_reserva}
                        </span>
                        <p className="text-2xs text-slate-500 mt-1">
                          {new Date(r.data_reserva).toLocaleString('pt-BR')}
                        </p>
                      </td>

                      {/* Obra */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 leading-tight">
                          {titulo?.titulo_de_livro || r.id_titulo}
                        </p>
                        <p className="text-2xs text-slate-500 mt-0.5">
                          {titulo?.autor} • Cód: <span className="font-mono font-bold">{r.id_titulo}</span>
                        </p>
                      </td>

                      {/* Leitor */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">
                          {leitor?.nome_do_leitor || `Leitor #${r.id_leitor}`}
                        </p>
                        <p className="text-2xs text-slate-500">{leitor?.email || leitor?.telefone || 'Sem contato'}</p>
                      </td>

                      {/* Disponibilidade */}
                      <td className="py-3 px-4">
                        {hasReadyCopy ? (
                          <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Exemplar Aguardando Retirada!
                          </span>
                        ) : (
                          <span className="text-2xs text-slate-500">
                            Todos os {copies.length} volumes em circulação
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">{getStatusBadge(r.status_reserva)}</td>

                      {/* Observações */}
                      <td className="py-3 px-4 text-2xs text-slate-600">
                        {r.observacoes || '—'}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status_reserva === 'Ativa' && (
                            <>
                              <button
                                onClick={() => onConvertReservaToLoan(r.id_titulo, r.id_leitor)}
                                className="px-2 py-1 text-2xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs flex items-center gap-1"
                                title="Atender reserva e realizar empréstimo"
                              >
                                Realizar Empréstimo &rarr;
                              </button>
                              <button
                                onClick={() => handleCancelReserva(r.id_reserva)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-700 hover:bg-amber-50"
                                title="Cancelar reserva"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteReserva(r.id_reserva)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* MODAL: NOVA RESERVA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">Solicitar / Registrar Reserva</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Obra Intelectual (Título) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedTitleId}
                  onChange={(e) => setSelectedTitleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {titulos
                    .filter((t) => t.ativo)
                    .map((t) => (
                      <option key={t.id_titulo} value={t.id_titulo}>
                        {t.id_titulo} — {t.titulo_de_livro} ({t.autor})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Leitor Solicitante <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedLeitorId}
                  onChange={(e) => setSelectedLeitorId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Selecione o Leitor --</option>
                  {leitores.map((l) => (
                    <option key={l.id_leitor} value={l.id_leitor} disabled={l.bloqueado}>
                      {l.nome_do_leitor} {l.bloqueado ? '— [BLOQUEADO]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações / Motivo
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Avisar pelo WhatsApp quando chegar..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  Confirmar Reserva na Fila
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
