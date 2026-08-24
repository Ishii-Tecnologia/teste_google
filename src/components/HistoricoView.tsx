import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Bookmark,
  Trash2,
  Calendar,
  User,
  Shield,
} from 'lucide-react';
import { HistoricoMovimentacao, Exemplar, Titulo, Leitor, TipoOperacao } from '../types';

interface HistoricoViewProps {
  historico: HistoricoMovimentacao[];
  exemplares: Exemplar[];
  titulos: Titulo[];
  leitores: Leitor[];
}

export const HistoricoView: React.FC<HistoricoViewProps> = ({
  historico,
  exemplares,
  titulos,
  leitores,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const getOperationBadge = (tipo: TipoOperacao) => {
    switch (tipo) {
      case 'Retirada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowUpRight className="w-3 h-3" /> Retirada (Empréstimo)
          </span>
        );
      case 'Devolucao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownLeft className="w-3 h-3" /> Devolução
          </span>
        );
      case 'Renovacao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3 h-3" /> Renovação
          </span>
        );
      case 'Reserva':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Bookmark className="w-3 h-3" /> Reserva
          </span>
        );
      case 'Baixa':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Trash2 className="w-3 h-3" /> Baixa Física
          </span>
        );
    }
  };

  const filteredHistorico = historico.filter((h) => {
    if (typeFilter !== 'ALL' && h.tipo_operacao !== typeFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchEx = h.id_exemplar.toLowerCase().includes(term);
      const matchUser = h.usuario_sistema.toLowerCase().includes(term);
      const matchDetails = h.detalhes?.toLowerCase().includes(term) || false;
      const matchLeitor = h.id_leitor?.toString().includes(term) || false;
      return matchEx || matchUser || matchDetails || matchLeitor;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Log de Auditoria Imutável (Histórico de Movimentações)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro cronológico protegido contra alterações de todas as operações (Retirada, Devolução, Renovação, Reserva e Baixa).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-2xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
            <Shield className="w-3 h-3 text-indigo-600" /> Auditoria Imutável (WORM)
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            id="input-search-historico"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por exemplar (ex: CX001-1), operador ou detalhes..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Operação:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="ALL">Todas as Operações ({historico.length})</option>
            <option value="Retirada">Retiradas</option>
            <option value="Devolucao">Devoluções</option>
            <option value="Renovacao">Renovações</option>
            <option value="Reserva">Reservas</option>
            <option value="Baixa">Baixas</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4"># Log / Timestamp</th>
                <th className="py-3 px-4">Tipo de Operação</th>
                <th className="py-3 px-4">Exemplar Físico / Obra</th>
                <th className="py-3 px-4">Leitor Envolvido</th>
                <th className="py-3 px-4">Operador do Sistema</th>
                <th className="py-3 px-4 text-right">Detalhes da Transação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredHistorico.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                filteredHistorico.map((h) => {
                  const ex = exemplares.find((e) => e.id_exemplar === h.id_exemplar);
                  const tit = ex ? titulos.find((t) => t.id_titulo === ex.id_titulo) : null;
                  const leitor = h.id_leitor ? leitores.find((l) => l.id_leitor === h.id_leitor) : null;

                  return (
                    <tr key={h.id_log} className="hover:bg-slate-50/70 transition-colors">
                      {/* Log ID & Timestamp */}
                      <td className="py-3 px-4 font-mono text-2xs">
                        <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{h.id_log}
                        </span>
                        <p className="text-slate-500 mt-1">
                          {new Date(h.data_hora).toLocaleString('pt-BR')}
                        </p>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-4">{getOperationBadge(h.tipo_operacao)}</td>

                      {/* Exemplar */}
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-indigo-700">{h.id_exemplar}</p>
                        {tit && <p className="text-2xs text-slate-500 truncate max-w-xs">{tit.titulo_de_livro}</p>}
                      </td>

                      {/* Leitor */}
                      <td className="py-3 px-4">
                        {leitor ? (
                          <div>
                            <p className="font-semibold text-slate-900">{leitor.nome_do_leitor}</p>
                            <p className="text-2xs text-slate-500 font-mono">#{leitor.id_leitor}</p>
                          </div>
                        ) : h.id_leitor ? (
                          <span className="font-mono text-2xs">Leitor #{h.id_leitor}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Operador */}
                      <td className="py-3 px-4 font-mono text-2xs">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium">
                          @{h.usuario_sistema}
                        </span>
                      </td>

                      {/* Detalhes */}
                      <td className="py-3 px-4 text-right text-2xs text-slate-600">
                        {h.detalhes || 'Transação registrada'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
