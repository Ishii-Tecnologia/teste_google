import React, { useState } from 'react';
import {
  BarChart3,
  AlertTriangle,
  UserCheck,
  Layers,
  TrendingUp,
  Bookmark,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  BookOpen,
} from 'lucide-react';
import { Titulo, Exemplar, Emprestimo, Leitor, Reserva, HistoricoMovimentacao } from '../types';

interface RelatoriosViewProps {
  titulos: Titulo[];
  exemplares: Exemplar[];
  emprestimos: Emprestimo[];
  leitores: Leitor[];
  reservas: Reserva[];
  historico: HistoricoMovimentacao[];
  initialSelectedReaderId?: number | null;
}

type ReportType = 'inadimplentes' | 'visao360' | 'inventario' | 'popularidade' | 'reservas';

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({
  titulos,
  exemplares,
  emprestimos,
  leitores,
  reservas,
  historico,
  initialSelectedReaderId,
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>(
    initialSelectedReaderId ? 'visao360' : 'inadimplentes'
  );
  const [reader360Id, setReader360Id] = useState<number>(
    initialSelectedReaderId || (leitores[0]?.id_leitor ?? 101)
  );
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<string>('ALL');

  // ==========================================
  // REPORT 1: INADIMPLENTES (Atrasos)
  // ==========================================
  const activeLoans = emprestimos.filter((e) => !e.data_devolucao_real);
  const overdueList = activeLoans
    .filter((e) => e.atraso)
    .map((emp) => {
      const exemplar = exemplares.find((ex) => ex.id_exemplar === emp.id_exemplar);
      const titulo = exemplar ? titulos.find((t) => t.id_titulo === exemplar.id_titulo) : null;
      const leitor = leitores.find((l) => l.id_leitor === emp.id_leitor);

      return {
        ...emp,
        exemplar,
        titulo,
        leitor,
        dias_atraso: emp.dias_atraso || 0,
      };
    })
    .sort((a, b) => b.dias_atraso - a.dias_atraso); // Ordenação decrescente por atraso

  // ==========================================
  // REPORT 2: VISÃO 360º DO LEITOR
  // ==========================================
  const currentReader = leitores.find((l) => l.id_leitor === reader360Id) || leitores[0];
  const readerLoans = emprestimos.filter((e) => e.id_leitor === currentReader?.id_leitor);
  const readerActiveLoans = readerLoans.filter((e) => !e.data_devolucao_real);
  const readerHistoryLoans = readerLoans.filter((e) => e.data_devolucao_real);
  const readerReservations = reservas.filter((r) => r.id_leitor === currentReader?.id_leitor);
  const punctualReturnsCount = readerHistoryLoans.filter((e) => !e.atraso).length;
  const punctualityRate =
    readerHistoryLoans.length > 0 ? Math.round((punctualReturnsCount / readerHistoryLoans.length) * 100) : 100;

  // ==========================================
  // REPORT 3: INVENTÁRIO DO ACERVO
  // ==========================================
  const inventoryList = exemplares
    .filter((e) => (inventoryStatusFilter === 'ALL' ? true : e.status === inventoryStatusFilter))
    .map((ex) => {
      const titulo = titulos.find((t) => t.id_titulo === ex.id_titulo);
      return {
        ...ex,
        titulo,
      };
    });

  // ==========================================
  // REPORT 4: RANKING DE POPULARIDADE
  // ==========================================
  const popularityRanking = titulos
    .map((t) => {
      const copies = exemplares.filter((e) => e.id_titulo === t.id_titulo);
      const copyIds = new Set(copies.map((c) => c.id_exemplar));
      const totalBorrows = emprestimos.filter((emp) => copyIds.has(emp.id_exemplar)).length;
      const totalReservations = reservas.filter((r) => r.id_titulo === t.id_titulo).length;
      const totalScore = totalBorrows * 2 + totalReservations;

      return {
        titulo: t,
        totalBorrows,
        totalReservations,
        totalScore,
        volumesTotal: t.vol,
        volumesDisponiveis: copies.filter((c) => c.status === 'Disponivel').length,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  // ==========================================
  // REPORT 5: MONITORAMENTO DE RESERVAS
  // ==========================================
  const activeReservationsQueue = reservas
    .filter((r) => r.status_reserva === 'Ativa')
    .map((r) => {
      const titulo = titulos.find((t) => t.id_titulo === r.id_titulo);
      const leitor = leitores.find((l) => l.id_leitor === r.id_leitor);
      const copies = exemplares.filter((e) => e.id_titulo === r.id_titulo);
      const availableCount = copies.filter((c) => c.status === 'Disponivel' || c.status === 'Reservado').length;

      return {
        ...r,
        titulo,
        leitor,
        copiesTotal: copies.length,
        availableCount,
      };
    })
    .sort((a, b) => new Date(a.data_reserva).getTime() - new Date(b.data_reserva).getTime());

  // Export CSV Helper
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (selectedReport === 'inadimplentes') {
      csvContent += 'Leitor;CPF;Email;Telefone;ID_Exemplar;Titulo;Data_Emprestimo;Data_Prevista;Dias_Atraso\n';
      overdueList.forEach((item) => {
        csvContent += `"${item.leitor?.nome_do_leitor}";"${item.leitor?.cpf || ''}";"${item.leitor?.email}";"${item.leitor?.telefone || ''}";"${item.id_exemplar}";"${item.titulo?.titulo_de_livro}";"${item.data_emprestimo}";"${item.data_prevista_devolucao}";"${item.dias_atraso}"\n`;
      });
    } else if (selectedReport === 'inventario') {
      csvContent += 'ID_Exemplar;ID_Titulo;Titulo;Autor;Categoria;Localizacao;Status\n';
      inventoryList.forEach((item) => {
        csvContent += `"${item.id_exemplar}";"${item.id_titulo}";"${item.titulo?.titulo_de_livro}";"${item.titulo?.autor}";"${item.titulo?.categoria}";"${item.localizacao}";"${item.status}"\n`;
      });
    } else if (selectedReport === 'popularidade') {
      csvContent += 'ID_Titulo;Titulo;Autor;Categoria;Total_Emprestimos;Total_Reservas;Volumes_Cadastrados\n';
      popularityRanking.forEach((item) => {
        csvContent += `"${item.titulo.id_titulo}";"${item.titulo.titulo_de_livro}";"${item.titulo.autor}";"${item.titulo.categoria}";"${item.totalBorrows}";"${item.totalReservations}";"${item.volumesTotal}"\n`;
      });
    } else if (selectedReport === 'reservas') {
      csvContent += 'ID_Reserva;Titulo;Autor;Leitor;Data_Solicitacao;Status\n';
      activeReservationsQueue.forEach((item) => {
        csvContent += `"${item.id_reserva}";"${item.titulo?.titulo_de_livro}";"${item.titulo?.autor}";"${item.leitor?.nome_do_leitor}";"${item.data_reserva}";"${item.status_reserva}"\n`;
      });
    } else if (selectedReport === 'visao360' && currentReader) {
      csvContent += `Visao 360 do Leitor: ${currentReader.nome_do_leitor} (ID: ${currentReader.id_leitor})\n`;
      csvContent += 'ID_Emprestimo;ID_Exemplar;Data_Emprestimo;Data_Prevista;Data_Devolucao;Atraso_Dias\n';
      readerLoans.forEach((item) => {
        csvContent += `"${item.id_emprestimo}";"${item.id_exemplar}";"${item.data_emprestimo}";"${item.data_prevista_devolucao}";"${item.data_devolucao_real || 'EM POSSE'}";"${item.dias_atraso || 0}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Report selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Relatórios e Indicadores do Sistema
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Relatórios analíticos e operacionais conforme especificado na Seção 8 do Documento de Arquitetura CEP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
            title="Exportar dados do relatório ativo em CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
            title="Imprimir relatório"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Reports Nav Tabs (The 5 official reports) */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-2 md:grid-cols-5 gap-1.5">
        <button
          onClick={() => setSelectedReport('inadimplentes')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all flex items-center gap-2 ${
            selectedReport === 'inadimplentes'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div className="min-w-0">
            <p className="truncate">1. Pessoas em Atraso</p>
            <p className="text-2xs opacity-80 font-normal">{overdueList.length} inadimplente(s)</p>
          </div>
        </button>

        <button
          onClick={() => setSelectedReport('visao360')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all flex items-center gap-2 ${
            selectedReport === 'visao360'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <div className="min-w-0">
            <p className="truncate">2. Visão 360º do Leitor</p>
            <p className="text-2xs opacity-80 font-normal">Histórico completo</p>
          </div>
        </button>

        <button
          onClick={() => setSelectedReport('inventario')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all flex items-center gap-2 ${
            selectedReport === 'inventario'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <div className="min-w-0">
            <p className="truncate">3. Inventário de Acervo</p>
            <p className="text-2xs opacity-80 font-normal">{exemplares.length} unidades</p>
          </div>
        </button>

        <button
          onClick={() => setSelectedReport('popularidade')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all flex items-center gap-2 ${
            selectedReport === 'popularidade'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <div className="min-w-0">
            <p className="truncate">4. Ranking Popularidade</p>
            <p className="text-2xs opacity-80 font-normal">Mais solicitados</p>
          </div>
        </button>

        <button
          onClick={() => setSelectedReport('reservas')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all flex items-center gap-2 ${
            selectedReport === 'reservas'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Bookmark className="w-4 h-4 shrink-0" />
          <div className="min-w-0">
            <p className="truncate">5. Fila de Reservas</p>
            <p className="text-2xs opacity-80 font-normal">{activeReservationsQueue.length} na espera</p>
          </div>
        </button>
      </div>

      {/* REPORT 1: INADIMPLENTES */}
      {selectedReport === 'inadimplentes' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Relatório de Pessoas em Atraso (Inadimplência)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Listagem nominal com títulos em posse, contatos, datas e ordenação decrescente por dias de atraso.
              </p>
            </div>
            <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              Total Inadimplentes: {overdueList.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Dias de Atraso</th>
                  <th className="py-3 px-4">Leitor / Contato</th>
                  <th className="py-3 px-4">Título em Posse</th>
                  <th className="py-3 px-4">Exemplar</th>
                  <th className="py-3 px-4">Data Retirada</th>
                  <th className="py-3 px-4">Prazo Vencido</th>
                  <th className="py-3 px-4 text-right">Status do Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {overdueList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-emerald-600 font-semibold">
                      🎉 Parabéns! Nenhum leitor inadimplente no momento. Todos os livros em dia.
                    </td>
                  </tr>
                ) : (
                  overdueList.map((item) => (
                    <tr key={item.id_emprestimo} className="hover:bg-rose-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-rose-600 text-white">
                          +{item.dias_atraso} dias
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.leitor?.nome_do_leitor}</p>
                        <p className="text-2xs text-slate-500 font-mono">CPF: {item.leitor?.cpf || '—'}</p>
                        <div className="flex items-center gap-2 mt-1 text-2xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {item.leitor?.email}
                          </span>
                          {item.leitor?.telefone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {item.leitor?.telefone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.titulo?.titulo_de_livro || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-indigo-700">
                        {item.id_exemplar}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-2xs">
                        {new Date(item.data_emprestimo).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-rose-700 font-bold font-mono text-2xs">
                        {new Date(item.data_prevista_devolucao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.leitor?.bloqueado ? (
                          <span className="text-2xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Bloqueado Automaticamente
                          </span>
                        ) : (
                          <span className="text-2xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Bloqueio Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 2: VISÃO 360º DO LEITOR */}
      {selectedReport === 'visao360' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs p-5 space-y-6">
          {/* Reader selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Visão 360º do Leitor & Histórico de Circulação
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Histórico consolidado de empréstimos em andamento, devoluções anteriores, índice de pontualidade e reservas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Selecionar Leitor:</span>
              <select
                value={reader360Id}
                onChange={(e) => setReader360Id(Number(e.target.value))}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold"
              >
                {leitores.map((l) => (
                  <option key={l.id_leitor} value={l.id_leitor}>
                    #{l.id_leitor} — {l.nome_do_leitor}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentReader && (
            <div className="space-y-6">
              {/* Leitor Profile Cards & Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-2xs font-bold uppercase text-slate-500">Dados do Leitor</span>
                  <p className="text-sm font-bold text-slate-900 mt-1">{currentReader.nome_do_leitor}</p>
                  <p className="text-2xs text-slate-600 mt-0.5">Matrícula: #{currentReader.id_leitor}</p>
                  <p className="text-2xs text-slate-600 font-mono">CPF: {currentReader.cpf || '—'}</p>
                  <p className="text-2xs text-slate-600">{currentReader.email}</p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-2xs font-bold uppercase text-emerald-800">Pontualidade Geral</span>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{punctualityRate}%</p>
                  <p className="text-2xs text-emerald-700 mt-0.5">
                    {punctualReturnsCount} de {readerHistoryLoans.length} devoluções sem atraso
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-2xs font-bold uppercase text-blue-800">Empréstimos em Posse</span>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{readerActiveLoans.length}</p>
                  <p className="text-2xs text-blue-700 mt-0.5">
                    {readerActiveLoans.some((a) => a.atraso) ? '⚠️ Possui atraso!' : 'Todos no prazo'}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-2xs font-bold uppercase text-purple-800">Histórico Total</span>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{readerLoans.length}</p>
                  <p className="text-2xs text-purple-700 mt-0.5">
                    {readerReservations.length} reserva(s) registradas
                  </p>
                </div>
              </div>

              {/* Empréstimos Ativos do Leitor */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  1. Livros Atualmente em Posse ({readerActiveLoans.length})
                </h4>
                {readerActiveLoans.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg">
                    Nenhum livro em posse no momento.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {readerActiveLoans.map((emp) => {
                      const ex = exemplares.find((e) => e.id_exemplar === emp.id_exemplar);
                      const tit = ex ? titulos.find((t) => t.id_titulo === ex.id_titulo) : null;

                      return (
                        <div key={emp.id_emprestimo} className="p-3 bg-white flex items-center justify-between">
                          <div>
                            <p className="font-bold text-xs text-slate-900">{tit?.titulo_de_livro}</p>
                            <p className="text-2xs text-slate-500">
                              Exemplar: <span className="font-mono font-bold text-indigo-700">{emp.id_exemplar}</span> • Retirado em: {new Date(emp.data_emprestimo).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-2xs font-bold px-2 py-0.5 rounded-full ${emp.atraso ? 'bg-rose-100 text-rose-800' : 'bg-emerald-50 text-emerald-700'}`}>
                              {emp.atraso ? `Atrasado em ${emp.dias_atraso}d` : `Prazo: ${new Date(emp.data_prevista_devolucao).toLocaleDateString('pt-BR')}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Histórico Anterior */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  2. Histórico de Devoluções Anteriores ({readerHistoryLoans.length})
                </h4>
                {readerHistoryLoans.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-lg">
                    Nenhum histórico de devolução anterior.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {readerHistoryLoans.map((emp) => {
                      const ex = exemplares.find((e) => e.id_exemplar === emp.id_exemplar);
                      const tit = ex ? titulos.find((t) => t.id_titulo === ex.id_titulo) : null;

                      return (
                        <div key={emp.id_emprestimo} className="p-3 bg-slate-50 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-slate-900">{tit?.titulo_de_livro}</p>
                            <p className="text-2xs text-slate-500 font-mono">{emp.id_exemplar}</p>
                          </div>
                          <div className="text-right text-2xs text-slate-600">
                            <span>Devolvido em: {new Date(emp.data_devolucao_real!).toLocaleDateString('pt-BR')}</span>
                            {emp.dias_atraso ? (
                              <p className="text-rose-600 font-semibold">({emp.dias_atraso}d atraso)</p>
                            ) : (
                              <p className="text-emerald-600 font-semibold">Pontual</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* REPORT 3: INVENTÁRIO DO ACERVO */}
      {selectedReport === 'inventario' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Inventário Físico do Acervo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Relação detalhada de cada unidade física por ID de Exemplar, Título, Autor, Localização e Status operacional.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Filtrar Status:</span>
              <select
                value={inventoryStatusFilter}
                onChange={(e) => setInventoryStatusFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="ALL">Todos os Status ({exemplares.length})</option>
                <option value="Disponivel">Disponível</option>
                <option value="Emprestado">Emprestado</option>
                <option value="Reservado">Reservado</option>
                <option value="Manutencao">Em Manutenção</option>
                <option value="Indisponivel">Indisponível</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">ID Exemplar</th>
                  <th className="py-3 px-4">Título da Obra</th>
                  <th className="py-3 px-4">Autor(a)</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Localização Física</th>
                  <th className="py-3 px-4 text-right">Status Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {inventoryList.map((item) => (
                  <tr key={item.id_exemplar} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{item.id_exemplar}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.titulo?.titulo_de_livro}</td>
                    <td className="py-3 px-4 text-slate-600">{item.titulo?.autor}</td>
                    <td className="py-3 px-4 text-2xs text-slate-500">{item.titulo?.categoria}</td>
                    <td className="py-3 px-4 text-2xs text-slate-700 bg-slate-50 font-medium">
                      {item.localizacao || 'Estante Geral'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: RANKING DE POPULARIDADE */}
      {selectedReport === 'popularidade' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs p-5 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Ranking de Popularidade de Obras (Subsídio a Novas Aquisições)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identificação dos títulos com maior demanda de empréstimos e reservas para orientar compras e doações.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Posição</th>
                  <th className="py-3 px-4">Obra / Autor</th>
                  <th className="py-3 px-4 text-center">Empréstimos Realizados</th>
                  <th className="py-3 px-4 text-center">Reservas Solicitadas</th>
                  <th className="py-3 px-4 text-center">Exemplares no Acervo</th>
                  <th className="py-3 px-4 text-right">Recomendação de Aquisição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {popularityRanking.map((item, index) => (
                  <tr key={item.titulo.id_titulo} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{item.titulo.titulo_de_livro}</p>
                      <p className="text-2xs text-slate-500">{item.titulo.autor} • {item.titulo.categoria}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-600">
                      {item.totalBorrows} retirada(s)
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-amber-600">
                      {item.totalReservations} reserva(s)
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-medium">{item.volumesTotal} vol(s)</span>
                      <span className="text-2xs text-slate-400 block">({item.volumesDisponiveis} disp.)</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.totalScore >= 3 && item.volumesDisponiveis === 0 ? (
                        <span className="text-2xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Alta Demanda: Adquirir +1 Vol
                        </span>
                      ) : (
                        <span className="text-2xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          Acervo Adequado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 5: FILA DE RESERVAS */}
      {selectedReport === 'reservas' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs p-5 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-600" />
              Monitoramento da Fila de Espera Ativa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fila cronológica de atendimento das obras reservadas.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-2xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4"># Reserva / Data</th>
                  <th className="py-3 px-4">Título Reservado</th>
                  <th className="py-3 px-4">Leitor na Fila</th>
                  <th className="py-3 px-4">Contato Leitor</th>
                  <th className="py-3 px-4 text-right">Previsão / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {activeReservationsQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Nenhuma reserva pendente na fila no momento.
                    </td>
                  </tr>
                ) : (
                  activeReservationsQueue.map((item) => (
                    <tr key={item.id_reserva} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-slate-900">
                        #{item.id_reserva}
                        <span className="block text-2xs text-slate-500 font-normal">
                          {new Date(item.data_reserva).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.titulo?.titulo_de_livro}</p>
                        <p className="text-2xs text-slate-500">{item.titulo?.autor}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.leitor?.nome_do_leitor}
                      </td>
                      <td className="py-3 px-4 text-2xs text-slate-600">
                        {item.leitor?.email} {item.leitor?.telefone ? `• ${item.leitor.telefone}` : ''}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.availableCount > 0 ? (
                          <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Exemplar Disponível para Retirada!
                          </span>
                        ) : (
                          <span className="text-2xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Aguardando Devolução Física
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
