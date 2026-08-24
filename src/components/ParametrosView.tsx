import React, { useState } from 'react';
import {
  Sliders,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Key,
} from 'lucide-react';
import { ParametroSistema } from '../types';
import { storageService } from '../services/storage';

interface ParametrosViewProps {
  parametros: ParametroSistema[];
  onRefresh: () => void;
  currentUsername: string;
}

export const ParametrosView: React.FC<ParametrosViewProps> = ({
  parametros,
  onRefresh,
  currentUsername,
}) => {
  const [editingParam, setEditingParam] = useState<ParametroSistema | null>(null);
  const [paramValue, setParamValue] = useState('');
  const [paramDesc, setParamDesc] = useState('');

  // Add new parameter modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'number' | 'string' | 'boolean'>('string');
  const [addError, setAddError] = useState<string | null>(null);

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenEdit = (param: ParametroSistema) => {
    setEditingParam(param);
    setParamValue(param.valor_parametro);
    setParamDesc(param.descricao_parametro);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParam) return;

    const list = storageService.getParametros();
    const index = list.findIndex((p) => p.id_parametro === editingParam.id_parametro);
    if (index === -1) return;

    list[index] = {
      ...list[index],
      valor_parametro: paramValue,
      descricao_parametro: paramDesc,
      ultima_atualizacao: new Date().toISOString(),
      atualizado_por: currentUsername,
    };

    storageService.saveParametros(list);
    setEditingParam(null);
    onRefresh();
    setFeedbackMessage({ type: 'success', text: `Parâmetro "${editingParam.chave_parametro}" atualizado com sucesso!` });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleAddParam = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const cleanKey = newKey.trim().toUpperCase().replace(/\s+/g, '_');
    if (!cleanKey) {
      setAddError('Chave do parâmetro é obrigatória.');
      return;
    }

    const list = storageService.getParametros();
    if (list.some((p) => p.chave_parametro === cleanKey)) {
      setAddError('Já existe um parâmetro com esta chave.');
      return;
    }

    const maxId = list.reduce((max, p) => (p.id_parametro > max ? p.id_parametro : max), 0);
    const newParam: ParametroSistema = {
      id_parametro: maxId + 1,
      chave_parametro: cleanKey,
      valor_parametro: newValue.trim(),
      descricao_parametro: newDesc.trim() || 'Parâmetro personalizado',
      tipo_dado: newType,
      ultima_atualizacao: new Date().toISOString(),
      atualizado_por: currentUsername,
    };

    list.push(newParam);
    storageService.saveParametros(list);
    setIsAddModalOpen(false);
    setNewKey('');
    setNewValue('');
    setNewDesc('');
    onRefresh();
    setFeedbackMessage({ type: 'success', text: `Novo parâmetro "${cleanKey}" criado!` });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDeleteParam = (id_parametro: number, chave: string) => {
    // Protect core keys
    const coreKeys = [
      'DIAS_PADRAO_EMPRESTIMO',
      'MAX_RENOVACOES_PERMITIDAS',
      'DIAS_AVISO_VENCIMENTO',
      'BLOQUEIO_AUTOMATICO_INADIMPLENTE',
      'NOME_BIBLIOTECA',
    ];

    if (coreKeys.includes(chave)) {
      alert(`O parâmetro do núcleo do sistema "${chave}" não pode ser excluído.`);
      return;
    }

    if (!window.confirm(`Deseja realmente excluir o parâmetro "${chave}"?`)) return;

    const list = storageService.getParametros().filter((p) => p.id_parametro !== id_parametro);
    storageService.saveParametros(list);
    onRefresh();
    setFeedbackMessage({ type: 'success', text: `Parâmetro "${chave}" removido.` });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Deseja restaurar os parâmetros operacionais para os padrões recomendados?')) return;
    const defaults = [
      {
        id_parametro: 1,
        chave_parametro: 'DIAS_PADRAO_EMPRESTIMO',
        valor_parametro: '15',
        descricao_parametro: 'Prazo padrão em dias corridos para devolução de livros emprestados',
        tipo_dado: 'number' as const,
        ultima_atualizacao: new Date().toISOString(),
        atualizado_por: currentUsername,
      },
      {
        id_parametro: 2,
        chave_parametro: 'MAX_RENOVACOES_PERMITIDAS',
        valor_parametro: '1',
        descricao_parametro: 'Número máximo de renovações consecutivas permitidas por exemplar (padrão: 1)',
        tipo_dado: 'number' as const,
        ultima_atualizacao: new Date().toISOString(),
        atualizado_por: currentUsername,
      },
      {
        id_parametro: 3,
        chave_parametro: 'DIAS_AVISO_VENCIMENTO',
        valor_parametro: '2',
        descricao_parametro: 'Dias de antecedência para sinal amarelo no semáforo visual',
        tipo_dado: 'number' as const,
        ultima_atualizacao: new Date().toISOString(),
        atualizado_por: currentUsername,
      },
      {
        id_parametro: 4,
        chave_parametro: 'BLOQUEIO_AUTOMATICO_INADIMPLENTE',
        valor_parametro: 'true',
        descricao_parametro: 'Bloqueio automático de leitor para novos empréstimos em caso de devolução atrasada',
        tipo_dado: 'boolean' as const,
        ultima_atualizacao: new Date().toISOString(),
        atualizado_por: currentUsername,
      },
      {
        id_parametro: 5,
        chave_parametro: 'NOME_BIBLIOTECA',
        valor_parametro: 'Biblioteca CEP - Centro Educacional Profissional',
        descricao_parametro: 'Nome oficial da instituição exibido nos comprovantes e cabeçalho',
        tipo_dado: 'string' as const,
        ultima_atualizacao: new Date().toISOString(),
        atualizado_por: currentUsername,
      },
    ];

    storageService.saveParametros(defaults);
    onRefresh();
    setFeedbackMessage({ type: 'success', text: 'Parâmetros restaurados para o padrão de fábrica.' });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            Configuração de Parâmetros do Sistema (Regras de Negócio)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configuração centralizada de prazos de empréstimo, tolerâncias, limites de renovação e regras de circulação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
            title="Restaurar parâmetros recomendados"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Padrões
          </button>
          <button
            id="btn-add-parametro"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Parâmetro
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

      {/* Parameters Cards & Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Chave do Parâmetro</th>
                <th className="py-3 px-4">Valor Configurado</th>
                <th className="py-3 px-4">Descrição & Finalidade</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Última Atualização</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {parametros.map((param) => (
                <tr key={param.id_parametro} className="hover:bg-slate-50/70 transition-colors">
                  {/* Chave */}
                  <td className="py-3 px-4 font-mono font-bold text-indigo-900">
                    <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {param.chave_parametro}
                    </span>
                  </td>

                  {/* Valor */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      {param.valor_parametro}
                    </span>
                    {param.chave_parametro === 'DIAS_PADRAO_EMPRESTIMO' && (
                      <span className="text-2xs text-slate-500 block">dias corridos</span>
                    )}
                    {param.chave_parametro === 'MAX_RENOVACOES_PERMITIDAS' && (
                      <span className="text-2xs text-slate-500 block">renovação(ões)</span>
                    )}
                  </td>

                  {/* Descrição */}
                  <td className="py-3 px-4 text-slate-600 text-xs max-w-sm">
                    {param.descricao_parametro}
                  </td>

                  {/* Tipo */}
                  <td className="py-3 px-4">
                    <span className="text-2xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {param.tipo_dado}
                    </span>
                  </td>

                  {/* Atualizado em */}
                  <td className="py-3 px-4 font-mono text-2xs text-slate-500">
                    {new Date(param.ultima_atualizacao).toLocaleDateString('pt-BR')}
                    <span className="block text-slate-400">por @{param.atualizado_por}</span>
                  </td>

                  {/* Ações */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(param)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 bg-white hover:bg-indigo-50 transition-colors"
                        title="Editar valor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteParam(param.id_parametro, param.chave_parametro)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 bg-white hover:bg-rose-50 transition-colors"
                        title="Excluir parâmetro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDITAR PARÂMETRO */}
      {editingParam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Alterar Parâmetro: {editingParam.chave_parametro}</h3>
              </div>
              <button
                onClick={() => setEditingParam(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chave do Parâmetro (Imutável)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingParam.chave_parametro}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-slate-100 text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valor do Parâmetro <span className="text-rose-500">*</span>
                </label>
                {editingParam.tipo_dado === 'boolean' ? (
                  <select
                    value={paramValue}
                    onChange={(e) => setParamValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="true">true (Ativado / Sim)</option>
                    <option value="false">false (Desativado / Não)</option>
                  </select>
                ) : editingParam.tipo_dado === 'number' ? (
                  <input
                    type="number"
                    required
                    value={paramValue}
                    onChange={(e) => setParamValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={paramValue}
                    onChange={(e) => setParamValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição e Finalidade
                </label>
                <textarea
                  rows={2}
                  value={paramDesc}
                  onChange={(e) => setParamDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingParam(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Salvar Parâmetro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO PARÂMETRO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Adicionar Novo Parâmetro</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddParam} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chave do Parâmetro (SNAKE_CASE) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                  placeholder="EX: LIMITE_LIVROS_POR_LEITOR"
                  className="w-full px-3 py-2 text-xs font-mono uppercase font-bold rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Dado</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="string">Texto (String)</option>
                    <option value="number">Número</option>
                    <option value="boolean">Booleano (True/False)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Valor inicial"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição e Regra
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Finalidade desta configuração no sistema..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  Criar Parâmetro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
