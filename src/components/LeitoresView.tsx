import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle,
  ShieldAlert,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Phone,
  Mail,
  History,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { Leitor, Emprestimo, Titulo, Exemplar } from '../types';
import { libraryService } from '../services/libraryService';

interface LeitoresViewProps {
  leitores: Leitor[];
  emprestimos: Emprestimo[];
  titulos: Titulo[];
  exemplares: Exemplar[];
  onRefresh: () => void;
  onViewReader360: (id_leitor: number) => void;
}

export const LeitoresView: React.FC<LeitoresViewProps> = ({
  leitores,
  emprestimos,
  titulos,
  exemplares,
  onRefresh,
  onViewReader360,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [showCpfMask, setShowCpfMask] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeitor, setEditingLeitor] = useState<Leitor | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nome_do_leitor: '',
    email: '',
    cpf: '',
    telefone: '',
    bloqueado: false,
    motivo_bloqueio: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Mask CPF for LGPD
  const formatCpf = (cpf?: string) => {
    if (!cpf) return '—';
    if (!showCpfMask) return cpf;
    const clean = cpf.replace(/\D/g, '');
    if (clean.length === 11) {
      return `***.${clean.substring(3, 6)}.***-${clean.substring(9, 11)}`;
    }
    return '***.***.***-**';
  };

  // Filtered readers
  const filteredLeitores = leitores.filter((l) => {
    if (statusFilter === 'ACTIVE' && l.bloqueado) return false;
    if (statusFilter === 'BLOCKED' && !l.bloqueado) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = l.nome_do_leitor.toLowerCase().includes(term);
      const matchEmail = l.email.toLowerCase().includes(term);
      const matchCpf = l.cpf?.toLowerCase().includes(term) || false;
      const matchId = l.id_leitor.toString().includes(term);
      return matchName || matchEmail || matchCpf || matchId;
    }
    return true;
  });

  const handleOpenCreate = () => {
    setEditingLeitor(null);
    setFormData({
      nome_do_leitor: '',
      email: '',
      cpf: '',
      telefone: '',
      bloqueado: false,
      motivo_bloqueio: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (leitor: Leitor) => {
    setEditingLeitor(leitor);
    setFormData({
      nome_do_leitor: leitor.nome_do_leitor,
      email: leitor.email,
      cpf: leitor.cpf || '',
      telefone: leitor.telefone || '',
      bloqueado: leitor.bloqueado,
      motivo_bloqueio: leitor.motivo_bloqueio || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.nome_do_leitor.trim() || !formData.email.trim()) {
      setFormError('Nome e E-mail são obrigatórios.');
      return;
    }

    if (editingLeitor) {
      const res = libraryService.updateLeitor(editingLeitor.id_leitor, {
        nome_do_leitor: formData.nome_do_leitor.trim(),
        email: formData.email.trim(),
        cpf: formData.cpf.trim() || undefined,
        telefone: formData.telefone.trim() || undefined,
        bloqueado: formData.bloqueado,
        motivo_bloqueio: formData.bloqueado ? formData.motivo_bloqueio : undefined,
      });

      if (!res.success) {
        setFormError(res.message);
        return;
      }
      setFeedbackMessage({ type: 'success', text: res.message });
    } else {
      const res = libraryService.createLeitor({
        nome_do_leitor: formData.nome_do_leitor.trim(),
        email: formData.email.trim(),
        cpf: formData.cpf.trim() || undefined,
        telefone: formData.telefone.trim() || undefined,
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

  const handleToggleBlock = (leitor: Leitor) => {
    const newStatus = !leitor.bloqueado;
    let motivo = leitor.motivo_bloqueio;
    if (newStatus) {
      const input = prompt(`Informe o motivo do bloqueio do leitor ${leitor.nome_do_leitor}:`, 'Bloqueio administrativo');
      if (input === null) return;
      motivo = input || 'Bloqueio administrativo';
    }

    libraryService.updateLeitor(leitor.id_leitor, {
      bloqueado: newStatus,
      motivo_bloqueio: newStatus ? motivo : undefined,
    });

    onRefresh();
  };

  const handleDelete = (id_leitor: number) => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente este leitor?')) return;
    const res = libraryService.deleteLeitor(id_leitor);
    if (!res.success) {
      alert(`Falha na exclusão: ${res.message}`);
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
            <Users className="w-5 h-5 text-indigo-600" />
            Cadastro de Usuários / Leitores da Biblioteca
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de vigência (Ativo/Bloqueado), conformidade com a LGPD e histórico 360° de empréstimos.
          </p>
        </div>

        <button
          id="btn-add-leitor"
          onClick={handleOpenCreate}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Novo Leitor
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
            id="input-search-leitores"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone, CPF ou ID do leitor..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          {/* LGPD Toggle */}
          <button
            onClick={() => setShowCpfMask(!showCpfMask)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5"
            title="Alternar proteção de dados LGPD no CPF"
          >
            {showCpfMask ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-indigo-600" />}
            <span>LGPD: {showCpfMask ? 'Mascarado' : 'Visível'}</span>
          </button>

          {/* Status filter */}
          <div className="flex rounded-lg border border-slate-300 overflow-hidden text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 ${
                statusFilter === 'ALL' ? 'bg-indigo-600 text-white font-semibold' : 'bg-white text-slate-600'
              }`}
            >
              Todos ({leitores.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 ${
                statusFilter === 'ACTIVE' ? 'bg-indigo-600 text-white font-semibold' : 'bg-white text-slate-600'
              }`}
            >
              Ativos ({leitores.filter((l) => !l.bloqueado).length})
            </button>
            <button
              onClick={() => setStatusFilter('BLOCKED')}
              className={`px-3 py-1.5 ${
                statusFilter === 'BLOCKED' ? 'bg-rose-600 text-white font-semibold' : 'bg-white text-rose-700'
              }`}
            >
              Bloqueados ({leitores.filter((l) => l.bloqueado).length})
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Matrícula / ID</th>
                <th className="py-3 px-4">Nome do Leitor</th>
                <th className="py-3 px-4">Contato (E-mail & Telefone)</th>
                <th className="py-3 px-4">CPF (LGPD)</th>
                <th className="py-3 px-4">Livros em Posse</th>
                <th className="py-3 px-4 text-center">Status / Vigência</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLeitores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum leitor cadastrado com esses parâmetros.
                  </td>
                </tr>
              ) : (
                filteredLeitores.map((l) => {
                  const activeLoans = emprestimos.filter((e) => e.id_leitor === l.id_leitor && !e.data_devolucao_real);
                  const overdueCount = activeLoans.filter((e) => e.atraso).length;

                  return (
                    <tr key={l.id_leitor} className="hover:bg-slate-50/70 transition-colors">
                      {/* ID */}
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-xs bg-slate-100 text-indigo-700 px-2 py-0.5 rounded border border-slate-200">
                          #{l.id_leitor}
                        </span>
                        <p className="text-2xs text-slate-600 mt-1">
                          Cad: {new Date(l.data_cadastro).toLocaleDateString('pt-BR')}
                        </p>
                      </td>

                      {/* Nome */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-sm leading-tight">
                          {l.nome_do_leitor}
                        </p>
                        {l.motivo_bloqueio && l.bloqueado && (
                          <p className="text-2xs text-rose-600 font-semibold mt-0.5">
                            Motivo: {l.motivo_bloqueio}
                          </p>
                        )}
                      </td>

                      {/* Contato */}
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{l.email}</span>
                        </div>
                        {l.telefone && (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{l.telefone}</span>
                          </div>
                        )}
                      </td>

                      {/* CPF */}
                      <td className="py-3 px-4 font-mono text-2xs text-slate-600">
                        {formatCpf(l.cpf)}
                      </td>

                      {/* Livros em Posse */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">{activeLoans.length}</span>
                          <span className="text-2xs text-slate-500">empréstimo(s)</span>
                        </div>
                        {overdueCount > 0 && (
                          <span className="text-2xs font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                            <ShieldAlert className="w-3 h-3" /> {overdueCount} em atraso!
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {l.bloqueado ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Lock className="w-3 h-3" /> Bloqueado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Ativo
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Visão 360 do usuário */}
                          <button
                            onClick={() => onViewReader360(l.id_leitor)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 bg-white hover:bg-indigo-50 transition-colors"
                            title="Ver Visão 360º do Leitor (Histórico Completo)"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Lock */}
                          <button
                            onClick={() => handleToggleBlock(l)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              l.bloqueado
                                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                                : 'bg-white border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                            }`}
                            title={l.bloqueado ? 'Desbloquear leitor' : 'Bloquear leitor para novos empréstimos'}
                          >
                            {l.bloqueado ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(l)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 bg-white hover:bg-indigo-50 transition-colors"
                            title="Editar dados"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(l.id_leitor)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 bg-white hover:bg-rose-50 transition-colors"
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

      {/* MODAL: INCLUSÃO / ALTERAÇÃO DE LEITOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  {editingLeitor ? `Alterar Leitor: #${editingLeitor.id_leitor}` : 'Cadastrar Novo Leitor'}
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome_do_leitor}
                  onChange={(e) => setFormData({ ...formData, nome_do_leitor: e.target.value })}
                  placeholder="Nome do leitor"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail para Alertas e Notificações <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="leitor@dominio.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CPF (Opcional)</label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(61) 90000-0000"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {editingLeitor && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="check-bloqueado"
                      checked={formData.bloqueado}
                      onChange={(e) => setFormData({ ...formData, bloqueado: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="check-bloqueado" className="text-xs font-bold text-slate-800">
                      Cadastro Bloqueado para Novos Empréstimos
                    </label>
                  </div>
                  {formData.bloqueado && (
                    <input
                      type="text"
                      value={formData.motivo_bloqueio}
                      onChange={(e) => setFormData({ ...formData, motivo_bloqueio: e.target.value })}
                      placeholder="Motivo do bloqueio..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  )}
                </div>
              )}

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
                  {editingLeitor ? 'Salvar Alterações' : 'Cadastrar Leitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
