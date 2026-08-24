import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Barcode,
  CheckCircle,
  Clock,
  Wrench,
  AlertOctagon,
  Printer,
  BookOpen,
} from 'lucide-react';
import { Exemplar, Titulo, StatusExemplar } from '../types';
import { libraryService } from '../services/libraryService';

interface ExemplaresViewProps {
  exemplares: Exemplar[];
  titulos: Titulo[];
  onRefresh: () => void;
  filterTitleId?: string | null;
  onClearTitleFilter?: () => void;
  onOpenBarcodeModal: (exemplar: Exemplar) => void;
}

export const ExemplaresView: React.FC<ExemplaresViewProps> = ({
  exemplares,
  titulos,
  onRefresh,
  filterTitleId,
  onClearTitleFilter,
  onOpenBarcodeModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExemplar, setEditingExemplar] = useState<Exemplar | null>(null);

  // Form State
  const [selectedTitleId, setSelectedTitleId] = useState<string>(titulos[0]?.id_titulo || '');
  const [formData, setFormData] = useState<{
    status: StatusExemplar;
    localizacao: string;
  }>({
    status: 'Disponivel',
    localizacao: 'Estante 1, Prateleira A',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtered exemplares
  const filteredExemplares = exemplares.filter((e) => {
    if (filterTitleId && e.id_titulo !== filterTitleId) return false;
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const titulo = titulos.find((t) => t.id_titulo === e.id_titulo);
      const matchCode = e.id_exemplar.toLowerCase().includes(term);
      const matchTitle = titulo?.titulo_de_livro.toLowerCase().includes(term) || false;
      const matchLoc = e.localizacao?.toLowerCase().includes(term) || false;
      return matchCode || matchTitle || matchLoc;
    }
    return true;
  });

  const getStatusBadge = (status: StatusExemplar) => {
    switch (status) {
      case 'Disponivel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Disponível
          </span>
        );
      case 'Emprestado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" /> Emprestado
          </span>
        );
      case 'Reservado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Reservado
          </span>
        );
      case 'Manutencao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Wrench className="w-3 h-3" /> Em Manutenção
          </span>
        );
      case 'Indisponivel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-3 h-3" /> Indisponível
          </span>
        );
    }
  };

  const handleOpenCreate = () => {
    setEditingExemplar(null);
    setSelectedTitleId(filterTitleId || titulos[0]?.id_titulo || '');
    setFormData({
      status: 'Disponivel',
      localizacao: 'Estante 1, Prateleira A',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exemplar: Exemplar) => {
    setEditingExemplar(exemplar);
    setFormData({
      status: exemplar.status,
      localizacao: exemplar.localizacao || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (editingExemplar) {
      const res = libraryService.updateExemplar(editingExemplar.id_exemplar, {
        status: formData.status,
        localizacao: formData.localizacao,
      });

      if (!res.success) {
        setFormError(res.message);
        return;
      }
      setFeedbackMessage({ type: 'success', text: res.message });
    } else {
      if (!selectedTitleId) {
        setFormError('Selecione uma obra intelectual para vincular a unidade física.');
        return;
      }

      const res = libraryService.createExemplar(selectedTitleId, formData.localizacao);
      if (!res.success) {
        setFormError(res.message);
        return;
      }
      setFeedbackMessage({ type: 'success', text: res.message });
    }

    setIsModalOpen(false);
    onRefresh();
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleDelete = (id_exemplar: string) => {
    const motivo = prompt(
      `Confirmação de Baixa para o exemplar ${id_exemplar}.\nInforme o motivo da baixa (ex: extravio, dano irreversível, doação):`,
      'Desgaste / Baixa física'
    );
    if (motivo === null) return; // user cancelled

    const res = libraryService.deleteExemplar(id_exemplar, motivo);
    if (!res.success) {
      alert(`Falha na baixa: ${res.message}`);
    } else {
      setFeedbackMessage({ type: 'success', text: res.message });
      onRefresh();
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const activeTitleObject = filterTitleId ? titulos.find((t) => t.id_titulo === filterTitleId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Gestão de Exemplares Físicos (Unidades)
            </h2>
            {activeTitleObject && (
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                Filtrado por: {activeTitleObject.titulo_de_livro} ({activeTitleObject.id_titulo})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle individual por volume, etiqueta de código de barras (&lt;ID_TITULO&gt;-&lt;seq&gt;), localização física e ciclo de vida.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filterTitleId && onClearTitleFilter && (
            <button
              onClick={onClearTitleFilter}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Remover Filtro de Obra
            </button>
          )}
          <button
            id="btn-add-exemplar"
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Novo Exemplar
          </button>
        </div>
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
            id="input-search-exemplares"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código de exemplar (ex: CX001-1), título ou localização..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50 uppercase"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">Todos os Status ({exemplares.length})</option>
            <option value="Disponivel">Disponível ({exemplares.filter((e) => e.status === 'Disponivel').length})</option>
            <option value="Emprestado">Emprestado ({exemplares.filter((e) => e.status === 'Emprestado').length})</option>
            <option value="Reservado">Reservado ({exemplares.filter((e) => e.status === 'Reservado').length})</option>
            <option value="Manutencao">Manutenção ({exemplares.filter((e) => e.status === 'Manutencao').length})</option>
            <option value="Indisponivel">Indisponível ({exemplares.filter((e) => e.status === 'Indisponivel').length})</option>
          </select>
        </div>
      </div>

      {/* Exemplares Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Código / ID Único</th>
                <th className="py-3 px-4">Obra Intelectual (Título)</th>
                <th className="py-3 px-4">Sequencial</th>
                <th className="py-3 px-4">Localização Física</th>
                <th className="py-3 px-4">Status Atual</th>
                <th className="py-3 px-4">Data Cadastro</th>
                <th className="py-3 px-4 text-right">Ações & Etiqueta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredExemplares.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum exemplar físico encontrado.
                  </td>
                </tr>
              ) : (
                filteredExemplares.map((e) => {
                  const titulo = titulos.find((t) => t.id_titulo === e.id_titulo);

                  return (
                    <tr key={e.id_exemplar} className="hover:bg-slate-50/70 transition-colors">
                      {/* ID Exemplar */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs px-2 py-1 bg-slate-900 text-white rounded border border-slate-700">
                            {e.id_exemplar}
                          </span>
                        </div>
                      </td>

                      {/* Título */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 leading-tight">
                          {titulo?.titulo_de_livro || e.id_titulo}
                        </p>
                        <p className="text-2xs text-slate-500 mt-0.5 font-medium">
                          {titulo?.autor} • Cód. Título: <span className="font-mono">{e.id_titulo}</span>
                        </p>
                      </td>

                      {/* Sequencial */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                        Vol. #{e.seq}
                      </td>

                      {/* Localização */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-2xs font-medium">
                          {e.localizacao || 'Estante Geral'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(e.status)}
                      </td>

                      {/* Data */}
                      <td className="py-3 px-4 text-2xs text-slate-500">
                        {new Date(e.created_at).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Barcode Label */}
                          <button
                            id={`btn-barcode-${e.id_exemplar}`}
                            onClick={() => onOpenBarcodeModal(e)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 bg-white hover:bg-indigo-50 transition-colors"
                            title="Gerar e Imprimir Etiqueta de Código de Barras"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            id={`btn-edit-exemplar-${e.id_exemplar}`}
                            onClick={() => handleOpenEdit(e)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 bg-white hover:bg-indigo-50 transition-colors"
                            title="Editar status e localização"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Baixa / Delete */}
                          {e.status !== 'Emprestado' && (
                            <button
                              id={`btn-delete-exemplar-${e.id_exemplar}`}
                              onClick={() => handleDelete(e.id_exemplar)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 bg-white hover:bg-rose-50 transition-colors"
                              title="Dar baixa física no exemplar (com auditoria)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL: INCLUSÃO / ALTERAÇÃO DE EXEMPLAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  {editingExemplar ? `Alterar Exemplar: ${editingExemplar.id_exemplar}` : 'Cadastrar Novo Exemplar Físico'}
                </h3>
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

              {/* Se for criação, selecionar o Título */}
              {!editingExemplar && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vincular à Obra Intelectual (Título) <span className="text-rose-500">*</span>
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
                  <p className="text-2xs text-slate-500 mt-1">
                    O ID do exemplar será gerado automaticamente com o próximo número sequencial.
                  </p>
                </div>
              )}

              {/* Status do Exemplar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Físico / Operacional <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusExemplar })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Disponivel">Disponível (Pronto para circulação)</option>
                  <option value="Manutencao">Em Manutenção (Encadernação / Reparo)</option>
                  <option value="Indisponivel">Indisponível (Consulta interna apenas)</option>
                  <option value="Reservado">Reservado (Fila de espera)</option>
                </select>
              </div>

              {/* Localização Física */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Localização Física na Biblioteca
                </label>
                <input
                  type="text"
                  value={formData.localizacao}
                  onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                  placeholder="Ex: Estante A, Prateleira 2, Seção Doutrinária"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
                >
                  {editingExemplar ? 'Salvar Alterações' : 'Cadastrar Exemplar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
