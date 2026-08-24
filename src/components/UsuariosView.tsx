import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Key,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { UsuarioSistema, PerfilUsuario } from '../types';
import { storageService } from '../services/storage';

interface UsuariosViewProps {
  usuarios: UsuarioSistema[];
  currentUser: UsuarioSistema;
  onRefresh: () => void;
  onSwitchUser: (user: UsuarioSistema) => void;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  usuarios,
  currentUser,
  onRefresh,
  onSwitchUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [perfilFilter, setPerfilFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioSistema | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    nome_completo: '',
    email: '',
    password: '',
    perfil: 'BIBLIOTECARIO' as PerfilUsuario,
    ativo: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getPerfilBadge = (perfil: PerfilUsuario) => {
    switch (perfil) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3" /> Administrador Total
          </span>
        );
      case 'BIBLIOTECARIO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <UserCheck className="w-3 h-3" /> Bibliotecário
          </span>
        );
      case 'ATENDENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <UserCheck className="w-3 h-3" /> Atendente (Balcão)
          </span>
        );
      case 'CONSULTOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <ShieldCheck className="w-3 h-3" /> Consultor (Somente Leitura)
          </span>
        );
    }
  };

  const filteredUsuarios = usuarios.filter((u) => {
    if (perfilFilter !== 'ALL' && u.perfil !== perfilFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchUser = u.username.toLowerCase().includes(term);
      const matchName = u.nome_completo.toLowerCase().includes(term);
      const matchEmail = u.email.toLowerCase().includes(term);
      return matchUser || matchName || matchEmail;
    }
    return true;
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      nome_completo: '',
      email: '',
      password: '',
      perfil: 'BIBLIOTECARIO',
      ativo: true,
    });
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UsuarioSistema) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      nome_completo: user.nome_completo,
      email: user.email,
      password: '', // blank unless changing
      perfil: user.perfil,
      ativo: user.ativo,
    });
    setFormError(null);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const list = storageService.getUsuarios();

    if (editingUser) {
      // Update
      const index = list.findIndex((u) => u.id_usuario === editingUser.id_usuario);
      if (index === -1) return;

      list[index] = {
        ...list[index],
        nome_completo: formData.nome_completo.trim(),
        email: formData.email.trim(),
        perfil: formData.perfil,
        ativo: formData.ativo,
        senha_hash: formData.password.trim() ? formData.password.trim() : list[index].senha_hash,
      };

      storageService.saveUsuarios(list);
      setFeedbackMessage({ type: 'success', text: `Usuário @${editingUser.username} atualizado com sucesso!` });
    } else {
      // Create
      const cleanUsername = formData.username.trim().toLowerCase().replace(/\s+/g, '');
      if (!cleanUsername) {
        setFormError('Nome de usuário (login) é obrigatório.');
        return;
      }

      if (list.some((u) => u.username.toLowerCase() === cleanUsername)) {
        setFormError('Já existe um usuário com este login.');
        return;
      }

      if (!formData.password.trim()) {
        setFormError('Senha de acesso é obrigatória para novos usuários.');
        return;
      }

      const maxId = list.reduce((max, u) => (u.id_usuario > max ? u.id_usuario : max), 0);
      const newUser: UsuarioSistema = {
        id_usuario: maxId + 1,
        username: cleanUsername,
        nome_completo: formData.nome_completo.trim(),
        email: formData.email.trim(),
        senha_hash: formData.password.trim(),
        perfil: formData.perfil,
        ativo: formData.ativo,
        criado_em: new Date().toISOString(),
      };

      list.push(newUser);
      storageService.saveUsuarios(list);
      setFeedbackMessage({ type: 'success', text: `Novo operador @${cleanUsername} cadastrado!` });
    }

    setIsModalOpen(false);
    onRefresh();
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDeleteUser = (id_usuario: number, username: string) => {
    if (username === currentUser.username) {
      alert('Você não pode excluir o usuário com o qual está logado atualmente.');
      return;
    }

    const list = storageService.getUsuarios();
    const adminCount = list.filter((u) => u.perfil === 'ADMIN').length;
    const target = list.find((u) => u.id_usuario === id_usuario);

    if (target?.perfil === 'ADMIN' && adminCount <= 1) {
      alert('Não é possível excluir o único Administrador do sistema.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja revogar o acesso e excluir permanentemente o usuário @${username}?`)) return;

    const filtered = list.filter((u) => u.id_usuario !== id_usuario);
    storageService.saveUsuarios(filtered);
    onRefresh();
    setFeedbackMessage({ type: 'success', text: `Usuário @${username} excluído com sucesso.` });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleToggleActive = (user: UsuarioSistema) => {
    if (user.username === currentUser.username) {
      alert('Você não pode desativar seu próprio acesso enquanto logado.');
      return;
    }

    const list = storageService.getUsuarios();
    const index = list.findIndex((u) => u.id_usuario === user.id_usuario);
    if (index === -1) return;

    list[index].ativo = !list[index].ativo;
    storageService.saveUsuarios(list);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Controle de Acessos, Usuários e Credenciais (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento de operadores do sistema, credenciais de acesso e papéis com permissões granulares.
          </p>
        </div>

        <button
          id="btn-add-usuario"
          onClick={handleOpenCreate}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Cadastrar Novo Operador
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

      {/* Matriz RBAC Informativa */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
          <span className="font-bold text-purple-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> ADMIN
          </span>
          <p className="text-2xs text-slate-300 mt-1">
            Acesso total ao sistema: Acervo, Circulação, Relatórios, Auditoria, Parâmetros e Gestão de Usuários.
          </p>
        </div>
        <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
          <span className="font-bold text-indigo-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> BIBLIOTECÁRIO
          </span>
          <p className="text-2xs text-slate-300 mt-1">
            Operação de acervo (Títulos/Exemplares), circulação total (Empréstimos/Reservas/Leitores) e relatórios.
          </p>
        </div>
        <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
          <span className="font-bold text-blue-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> ATENDENTE
          </span>
          <p className="text-2xs text-slate-300 mt-1">
            Focado no balcão de atendimento: Empréstimos, devoluções, cadastro rápido de leitores e reservas.
          </p>
        </div>
        <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
          <span className="font-bold text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> CONSULTOR
          </span>
          <p className="text-2xs text-slate-300 mt-1">
            Acesso somente para leitura: Consultas de acervo e emissão de relatórios sem permissão de gravação.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            id="input-search-usuarios"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por login (@username), nome ou e-mail..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex rounded-lg border border-slate-300 overflow-hidden text-xs">
          <button
            onClick={() => setPerfilFilter('ALL')}
            className={`px-3 py-1.5 ${
              perfilFilter === 'ALL' ? 'bg-indigo-600 text-white font-semibold' : 'bg-white text-slate-600'
            }`}
          >
            Todos ({usuarios.length})
          </button>
          <button
            onClick={() => setPerfilFilter('ADMIN')}
            className={`px-3 py-1.5 ${
              perfilFilter === 'ADMIN' ? 'bg-purple-600 text-white font-semibold' : 'bg-white text-slate-600'
            }`}
          >
            Admins
          </button>
          <button
            onClick={() => setPerfilFilter('BIBLIOTECARIO')}
            className={`px-3 py-1.5 ${
              perfilFilter === 'BIBLIOTECARIO' ? 'bg-indigo-600 text-white font-semibold' : 'bg-white text-slate-600'
            }`}
          >
            Bibliotecários
          </button>
          <button
            onClick={() => setPerfilFilter('ATENDENTE')}
            className={`px-3 py-1.5 ${
              perfilFilter === 'ATENDENTE' ? 'bg-blue-600 text-white font-semibold' : 'bg-white text-slate-600'
            }`}
          >
            Atendentes
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Usuário / Credencial</th>
                <th className="py-3 px-4">Nome Completo</th>
                <th className="py-3 px-4">E-mail Institucional</th>
                <th className="py-3 px-4">Perfil de Acesso (Papel)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações Operacionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredUsuarios.map((u) => {
                const isCurrent = u.username === currentUser.username;

                return (
                  <tr key={u.id_usuario} className={`hover:bg-slate-50/70 transition-colors ${isCurrent ? 'bg-indigo-50/30' : ''}`}>
                    {/* Login & Senha */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          @{u.username}
                        </span>
                        {isCurrent && (
                          <span className="text-2xs font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                            (Você)
                          </span>
                        )}
                      </div>
                      <p className="text-2xs text-slate-400 font-mono mt-0.5">
                        Senha: ••••••••
                      </p>
                    </td>

                    {/* Nome */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {u.nome_completo}
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 text-slate-600">
                      {u.email}
                    </td>

                    {/* Perfil */}
                    <td className="py-3 px-4">
                      {getPerfilBadge(u.perfil)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {u.ativo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" /> Inativo
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Simular / Logar com este perfil */}
                        {!isCurrent && (
                          <button
                            onClick={() => onSwitchUser(u)}
                            className="px-2 py-1 text-2xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                            title="Alternar sessão para este usuário"
                          >
                            Entrar como &rarr;
                          </button>
                        )}

                        {/* Lock / Unlock */}
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.ativo
                              ? 'bg-white border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title={u.ativo ? 'Desativar acesso' : 'Reativar acesso'}
                        >
                          {u.ativo ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 bg-white hover:bg-indigo-50 transition-colors"
                          title="Editar dados e credenciais"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteUser(u.id_usuario, u.username)}
                          disabled={isCurrent}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isCurrent
                              ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                              : 'bg-white border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50'
                          }`}
                          title={isCurrent ? 'Não pode excluir usuário logado' : 'Excluir usuário'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: INCLUSÃO / EDIÇÃO DE USUÁRIO E SENHA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">
                  {editingUser ? `Editar Operador: @${editingUser.username}` : 'Cadastrar Novo Operador de Sistema'}
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
                  Nome de Usuário (Login / Username) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                  placeholder="Ex: ana.bibliotecaria"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                  placeholder="Nome do operador"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Institucional <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="operador@bibliotecacep.com.br"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editingUser ? 'Redefinir Senha de Acesso (Opcional)' : 'Senha de Acesso Inicial *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Deixe em branco para manter a senha atual' : 'Defina a senha'}
                    className="w-full pl-3 pr-9 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Perfil */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Perfil de Acesso & Permissões (RBAC) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.perfil}
                  onChange={(e) => setFormData({ ...formData, perfil: e.target.value as PerfilUsuario })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  <option value="ADMIN">ADMIN — Administrador Geral (Acesso Total)</option>
                  <option value="BIBLIOTECARIO">BIBLIOTECARIO — Gestão de Acervo e Circulação</option>
                  <option value="ATENDENTE">ATENDENTE — Balcão de Empréstimos e Devoluções</option>
                  <option value="CONSULTOR">CONSULTOR — Apenas Consulta e Relatórios</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="check-user-ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="check-user-ativo" className="text-xs font-semibold text-slate-700">
                  Conta Ativa (Pode efetuar login no sistema)
                </label>
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
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar Operador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
