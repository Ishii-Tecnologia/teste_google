import React, { useState } from 'react';
import {
  BookMarked,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Layers,
  CheckCircle,
  XCircle,
  ExternalLink,
  Eye,
  BookOpen,
  Sparkles,
  Info,
} from 'lucide-react';
import { Titulo, Exemplar, Reserva, Emprestimo } from '../types';
import { libraryService } from '../services/libraryService';

interface TitulosViewProps {
  titulos: Titulo[];
  exemplares: Exemplar[];
  emprestimos: Emprestimo[];
  reservas: Reserva[];
  onRefresh: () => void;
  onViewExemplaresOfTitle: (id_titulo: string) => void;
}

export const TitulosView: React.FC<TitulosViewProps> = ({
  titulos,
  exemplares,
  emprestimos,
  reservas,
  onRefresh,
  onViewExemplaresOfTitle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTitulo, setEditingTitulo] = useState<Titulo | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    custom_id: '',
    titulo_de_livro: '',
    autor: '',
    editora: '',
    ano_publicacao: '' as string | number,
    isbn: '',
    categoria: 'Doutrina Espírita',
    vol: 1,
    capa_url: '',
    localizacao_padrao: 'Estante Geral, Prateleira 1',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Categories list
  const categories = Array.from(
    new Set([
      'Doutrina Espírita',
      'Romance Mediúnico',
      'Romance Histórico',
      'Série Psicológica',
      'Estudo e Filosofia',
      'Infantojuvenil',
      'Mensagens & Reflexões',
      'Científico & Histórico',
      'Geral',
      ...titulos.map((t) => t.categoria).filter(Boolean),
    ])
  );

  // Preset cover images for easy selection
  const presetCovers = [
    { label: 'Livro Clássico Azul', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400' },
    { label: 'Doutrina Estudo', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400' },
    { label: 'Evangelho Luz', url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400' },
    { label: 'História & Filosofia', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400' },
    { label: 'Romance Histórico', url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=400' },
    { label: 'Psicologia & Autoconhecimento', url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&q=80&w=400' },
  ];

  // Live calculation of Initials for suggested ID
  const calculatedInitials = formData.autor ? libraryService.generateInitials(formData.autor) : 'XX';
  const suggestedId = formData.autor ? libraryService.getNextTitleId(formData.autor) : 'XX001';

  // Filtered titles
  const filteredTitulos = titulos.filter((t) => {
    if (statusFilter === 'ACTIVE' && !t.ativo) return false;
    if (statusFilter === 'INACTIVE' && t.ativo) return false;
    if (categoryFilter !== 'ALL' && t.categoria !== categoryFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchId = t.id_titulo.toLowerCase().includes(term);
      const matchTitle = t.titulo_de_livro.toLowerCase().includes(term);
      const matchAuthor = t.autor.toLowerCase().includes(term);
      const matchIsbn = t.isbn?.toLowerCase().includes(term) || false;
      return matchId || matchTitle || matchAuthor || matchIsbn;
    }
    return true;
  });

  const handleOpenCreate = () => {
    setEditingTitulo(null);
    setFormData({
      custom_id: '',
      titulo_de_livro: '',
      autor: '',
      editora: 'FEB Editora',
      ano_publicacao: 2024,
      isbn: '',
      categoria: 'Doutrina Espírita',
      vol: 1,
      capa_url: presetCovers[0].url,
      localizacao_padrao: 'Estante A, Prateleira 1',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (titulo: Titulo) => {
    setEditingTitulo(titulo);
    setFormData({
      custom_id: titulo.id_titulo,
      titulo_de_livro: titulo.titulo_de_livro,
      autor: titulo.autor,
      editora: titulo.editora || '',
      ano_publicacao: titulo.ano_publicacao || '',
      isbn: titulo.isbn || '',
      categoria: titulo.categoria || 'Geral',
      vol: titulo.vol,
      capa_url: titulo.capa_url || '',
      localizacao_padrao: 'Estante Geral',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.titulo_de_livro.trim() || !formData.autor.trim()) {
      setFormError('Título e Autor são campos mandatórios.');
      return;
    }

    const year = formData.ano_publicacao ? Number(formData.ano_publicacao) : undefined;
    if (year && (year < 1000 || year > 2200)) {
      setFormError('Ano de publicação deve estar entre 1000 e 2200.');
      return;
    }

    if (formData.vol < 0) {
      setFormError('A quantidade de volumes deve ser maior ou igual a 0.');
      return;
    }

    if (editingTitulo) {
      // Update
      const res = libraryService.updateTitulo(editingTitulo.id_titulo, {
        titulo_de_livro: formData.titulo_de_livro,
        autor: formData.autor,
        editora: formData.editora || undefined,
        ano_publicacao: year,
        isbn: formData.isbn || undefined,
        categoria: formData.categoria,
        vol: Number(formData.vol),
        capa_url: formData.capa_url || undefined,
        localizacao_padrao: formData.localizacao_padrao,
      });

      if (!res.success) {
        setFormError(res.message);
        return;
      }

      setFeedbackMessage({ type: 'success', text: res.message });
    } else {
      // Create
      const res = libraryService.createTitulo({
        titulo_de_livro: formData.titulo_de_livro,
        autor: formData.autor,
        editora: formData.editora || undefined,
        ano_publicacao: year,
        isbn: formData.isbn || undefined,
        categoria: formData.categoria,
        vol: Number(formData.vol),
        capa_url: formData.capa_url || undefined,
        custom_id: formData.custom_id || undefined,
        localizacao_padrao: formData.localizacao_padrao,
      });

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

  const handleDelete = (id_titulo: string) => {
    if (!window.confirm(`Tem certeza que deseja desativar (soft delete) o título "${id_titulo}"?`)) {
      return;
    }

    const res = libraryService.deleteTitulo(id_titulo);
    if (!res.success) {
      alert(`Não foi possível desativar: ${res.message}`);
    } else {
      setFeedbackMessage({ type: 'success', text: res.message });
      onRefresh();
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-600" />
            Catálogo de Títulos (Camada Intelectual)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de obras com validação de unicidade (ISBN/Título+Autor) e geração automatizada de exemplares físicos.
          </p>
        </div>

        <button
          id="btn-add-titulo"
          onClick={handleOpenCreate}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Novo Título
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
            id="input-search-titulos"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, autor, código ID (ex: CX001) ou ISBN..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex rounded-lg border border-slate-300 overflow-hidden text-xs">
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Ativos ({titulos.filter((t) => t.ativo).length})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 ${
                statusFilter === 'INACTIVE'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Inativos ({titulos.filter((t) => !t.ativo).length})
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 ${
                statusFilter === 'ALL'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todos ({titulos.length})
            </button>
          </div>
        </div>
      </div>

      {/* Titles Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Capa / ID</th>
                <th className="py-3 px-4">Título & Autor</th>
                <th className="py-3 px-4">Categoria / Editora</th>
                <th className="py-3 px-4">Ano / ISBN</th>
                <th className="py-3 px-4 text-center">Exemplares Físicos</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredTitulos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum título encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTitulos.map((t) => {
                  const copies = exemplares.filter((e) => e.id_titulo === t.id_titulo);
                  const availableCopies = copies.filter((e) => e.status === 'Disponivel').length;
                  const borrowedCopies = copies.filter((e) => e.status === 'Emprestado').length;
                  const reservedCopies = copies.filter((e) => e.status === 'Reservado').length;

                  return (
                    <tr key={t.id_titulo} className="hover:bg-slate-50/70 transition-colors">
                      {/* Capa & ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {t.capa_url ? (
                            <img
                              src={t.capa_url}
                              alt={t.titulo_de_livro}
                              referrerPolicy="no-referrer"
                              className="w-10 h-14 object-cover rounded shadow-2xs border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded flex flex-col items-center justify-center font-bold text-2xs shrink-0">
                              <BookOpen className="w-4 h-4 mb-0.5" />
                              <span>{t.id_titulo}</span>
                            </div>
                          )}
                          <div>
                            <span className="inline-block font-mono font-bold text-xs bg-slate-100 text-indigo-700 border border-slate-200 px-1.5 py-0.5 rounded">
                              {t.id_titulo}
                            </span>
                            <p className="text-2xs text-slate-600 mt-0.5">
                              {new Date(t.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Título & Autor */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-sm leading-tight">
                          {t.titulo_de_livro}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">{t.autor}</p>
                      </td>

                      {/* Categoria / Editora */}
                      <td className="py-3 px-4">
                        <span className="inline-block text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {t.categoria || 'Geral'}
                        </span>
                        {t.editora && <p className="text-2xs text-slate-500 mt-1">{t.editora}</p>}
                      </td>

                      {/* Ano / ISBN */}
                      <td className="py-3 px-4 font-mono text-2xs text-slate-600">
                        <div>Ano: {t.ano_publicacao || '—'}</div>
                        <div className="text-slate-600">ISBN: {t.isbn || '—'}</div>
                      </td>

                      {/* Exemplares / Volumes */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onViewExemplaresOfTitle(t.id_titulo)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 transition-colors"
                          title="Clique para gerenciar os exemplares físicos deste título"
                        >
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-bold text-xs">{copies.length}</span>
                          <span className="text-2xs text-slate-500">vol(s)</span>
                        </button>
                        <div className="text-2xs mt-1 flex items-center justify-center gap-1.5">
                          <span className="text-emerald-600 font-semibold">{availableCopies} disp.</span>
                          {borrowedCopies > 0 && (
                            <span className="text-blue-600">({borrowedCopies} emp.)</span>
                          )}
                          {reservedCopies > 0 && (
                            <span className="text-amber-600">({reservedCopies} res.)</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {t.ativo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-500 border border-slate-300">
                            <XCircle className="w-3 h-3" /> Inativo
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-edit-titulo-${t.id_titulo}`}
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 bg-white hover:bg-indigo-50 transition-colors"
                            title="Editar metadados do título"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {t.ativo && (
                            <button
                              id={`btn-delete-titulo-${t.id_titulo}`}
                              onClick={() => handleDelete(t.id_titulo)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 bg-white hover:bg-rose-50 transition-colors"
                              title="Desativar (soft delete)"
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

      {/* MODAL: INCLUSÃO / ALTERAÇÃO DE TÍTULO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookMarked className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  {editingTitulo ? `Alterar Título: ${editingTitulo.id_titulo}` : 'Cadastrar Nova Obra (Título)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {formError}
                </div>
              )}

              {/* Identification rule banner */}
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Regra de Identificação e Máscara de ID (&lt;INICIAIS&gt;&lt;nnn&gt;):</p>
                  <p className="text-2xs text-indigo-800 mt-0.5">
                    O ID do título é gerado automaticamente com base na 1ª letra do primeiro nome + 1ª letra do último sobrenome do autor. 
                    {formData.autor && (
                      <span className="font-bold ml-1">
                        Iniciais geradas: {calculatedInitials} &rarr; Sugestão de ID: {suggestedId}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Título de livro */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título da Obra <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titulo_de_livro}
                    onChange={(e) => setFormData({ ...formData, titulo_de_livro: e.target.value })}
                    placeholder="Ex: Nosso Lar, O Livro dos Espíritos, etc."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Autor */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Autor(a) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.autor}
                    onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                    placeholder="Ex: Chico Xavier, Allan Kardec, etc."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* ID Customizado (opcional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ID do Título {editingTitulo ? '(Imutável)' : '(Automático ou Customizado)'}
                  </label>
                  <input
                    type="text"
                    disabled={!!editingTitulo}
                    value={editingTitulo ? editingTitulo.id_titulo : formData.custom_id || suggestedId}
                    onChange={(e) => setFormData({ ...formData, custom_id: e.target.value.toUpperCase() })}
                    placeholder={suggestedId}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 uppercase bg-slate-50 focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
                  />
                </div>

                {/* Editora */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Editora</label>
                  <input
                    type="text"
                    value={formData.editora}
                    onChange={(e) => setFormData({ ...formData, editora: e.target.value })}
                    placeholder="Ex: FEB Editora, IDE, LEAL..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria / Gênero</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ano de Publicação */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ano de Publicação (1000 a 2200)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="2200"
                    value={formData.ano_publicacao}
                    onChange={(e) => setFormData({ ...formData, ano_publicacao: e.target.value })}
                    placeholder="Ex: 1944"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* ISBN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ISBN (Único)</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="Ex: 978-8573289442"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Volumes / Exemplares Físicos */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantidade de Volumes / Exemplares Físicos <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.vol}
                    onChange={(e) => setFormData({ ...formData, vol: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-2xs text-slate-500 mt-1">
                    Gera automaticamente códigos de exemplar sequenciais (&lt;ID&gt;-1, &lt;ID&gt;-2, etc.).
                  </p>
                </div>

                {/* Localização Padrão */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Localização Física Padrão</label>
                  <input
                    type="text"
                    value={formData.localizacao_padrao}
                    onChange={(e) => setFormData({ ...formData, localizacao_padrao: e.target.value })}
                    placeholder="Ex: Estante 1, Prateleira B"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Capa URL */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">URL da Capa</label>
                  <input
                    type="url"
                    value={formData.capa_url}
                    onChange={(e) => setFormData({ ...formData, capa_url: e.target.value })}
                    placeholder="https://exemplo.com/capa.jpg"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                  {/* Preset cover selector */}
                  <div className="mt-2">
                    <p className="text-2xs font-semibold text-slate-500 mb-1">Ou selecione uma capa padrão do acervo:</p>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {presetCovers.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, capa_url: preset.url })}
                          className={`flex items-center gap-1 px-2 py-1 text-2xs rounded-lg border transition-colors shrink-0 ${
                            formData.capa_url === preset.url
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <img src={preset.url} alt="" className="w-3.5 h-4 object-cover rounded-2xs" />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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
                  {editingTitulo ? 'Salvar Alterações' : 'Confirmar Cadastro de Título'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
