import React, { useState } from 'react';
import {
  BookMarked,
  Layers,
  Repeat,
  AlertTriangle,
  Bookmark,
  Users,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Barcode,
} from 'lucide-react';
import { Titulo, Exemplar, Emprestimo, Leitor, Reserva, ActiveTab } from '../types';
import { libraryService } from '../services/libraryService';

interface DashboardViewProps {
  titulos: Titulo[];
  exemplares: Exemplar[];
  emprestimos: Emprestimo[];
  leitores: Leitor[];
  reservas: Reserva[];
  historico?: any[];
  onNavigate: (tab: any) => void;
  onRefresh?: () => void;
  onOpenReceipt?: (data: any) => void;
  onOpenNewLoan?: () => void;
  onOpenQuickReturn?: (exemplarId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  titulos,
  exemplares,
  emprestimos,
  leitores,
  reservas,
  onNavigate,
  onOpenNewLoan,
  onOpenQuickReturn,
}) => {
  const handleNewLoan = () => {
    if (onOpenNewLoan) {
      onOpenNewLoan();
    } else {
      onNavigate('circulacao');
    }
  };

  const handleQuickReturn = (exemplarId?: string) => {
    if (onOpenQuickReturn) {
      onOpenQuickReturn(exemplarId);
    } else {
      onNavigate('circulacao');
    }
  };
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    action?: () => void;
    actionLabel?: string;
  } | null>(null);

  // Computed metrics
  const activeTitlesCount = titulos.filter((t) => t.ativo).length;
  const totalExemplaresCount = exemplares.length;
  const availableExemplaresCount = exemplares.filter((e) => e.status === 'Disponivel').length;
  const activeLoans = emprestimos.filter((e) => !e.data_devolucao_real);
  const overdueLoans = activeLoans.filter((e) => e.atraso);
  const activeReservations = reservas.filter((r) => r.status_reserva === 'Ativa');
  const blockedReaders = leitores.filter((l) => l.bloqueado);

  // Quick Barcode Scan handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const code = barcodeInput.trim().toUpperCase();
    const exemplar = exemplares.find((ex) => ex.id_exemplar.toUpperCase() === code);

    if (!exemplar) {
      setScanResult({
        type: 'error',
        message: `Exemplar código "${code}" não encontrado no acervo físico.`,
      });
      return;
    }

    const titulo = titulos.find((t) => t.id_titulo === exemplar.id_titulo);
    const titleName = titulo ? `"${titulo.titulo_de_livro}"` : exemplar.id_titulo;

    if (exemplar.status === 'Disponivel') {
      setScanResult({
        type: 'info',
        message: `Exemplar ${exemplar.id_exemplar} (${titleName}) está DISPONÍVEL na localização "${exemplar.localizacao || 'Estante Principal'}".`,
        action: () => handleNewLoan(),
        actionLabel: 'Realizar Empréstimo',
      });
    } else if (exemplar.status === 'Emprestado') {
      const activeLoan = activeLoans.find((l) => l.id_exemplar === exemplar.id_exemplar);
      const leitor = activeLoan ? leitores.find((r) => r.id_leitor === activeLoan.id_leitor) : null;
      setScanResult({
        type: activeLoan?.atraso ? 'warning' : 'info',
        message: `Exemplar ${exemplar.id_exemplar} está EMPRESTADO para ${leitor?.nome_do_leitor || 'Leitor'} ${
          activeLoan?.atraso ? `(ATRASADO em ${activeLoan.dias_atraso} dias)` : '(Dentro do prazo)'
        }.`,
        action: () => handleQuickReturn(exemplar.id_exemplar),
        actionLabel: 'Confirmar Devolução',
      });
    } else if (exemplar.status === 'Reservado') {
      setScanResult({
        type: 'warning',
        message: `Exemplar ${exemplar.id_exemplar} está RESERVADO na fila de espera.`,
        action: () => onNavigate('reservas'),
        actionLabel: 'Ver Fila de Reservas',
      });
    } else {
      setScanResult({
        type: 'error',
        message: `Exemplar ${exemplar.id_exemplar} está em status "${exemplar.status}".`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Painel Operacional
            </span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1 text-white tracking-tight">
            Biblioteca Coligação Espírita Progressista — CEP
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Gestão integrada de obras intelectuais (Títulos) e unidades físicas (Exemplares) com controle de circulação em duas camadas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            id="btn-dash-new-loan"
            onClick={handleNewLoan}
            className="flex-1 md:flex-initial px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Repeat className="w-4 h-4" />
            Novo Empréstimo
          </button>
          <button
            id="btn-dash-quick-return"
            onClick={() => handleQuickReturn()}
            className="flex-1 md:flex-initial px-4 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Devolver Livro
          </button>
        </div>
      </div>

      {/* Overdue Alert Banner if any */}
      {overdueLoans.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Atenção: {overdueLoans.length} empréstimo(s) em atraso!
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Existem leitores com prazo de devolução vencido. As sanções administrativas automáticas de bloqueio estão ativas.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('relatorios')}
            className="shrink-0 px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 bg-white rounded-lg border border-rose-300 shadow-2xs flex items-center gap-1"
          >
            Ver Inadimplentes &rarr;
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Títulos */}
        <div
          onClick={() => onNavigate('titulos')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-700">Títulos</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{activeTitlesCount}</p>
          <p className="text-2xs text-slate-700 mt-1">Obras intelectuais</p>
        </div>

        {/* Exemplares */}
        <div
          onClick={() => onNavigate('exemplares')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-700">Exemplares</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalExemplaresCount}</p>
          <p className="text-2xs text-emerald-600 mt-1 font-medium">{availableExemplaresCount} disponíveis</p>
        </div>

        {/* Empréstimos Ativos */}
        <div
          onClick={() => onNavigate('circulacao')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-700">Empréstimos</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{activeLoans.length}</p>
          <p className="text-2xs text-slate-700 mt-1">Em posse de leitores</p>
        </div>

        {/* Em Atraso */}
        <div
          onClick={() => onNavigate('relatorios')}
          className={`p-4 rounded-xl border shadow-2xs transition-all cursor-pointer group ${
            overdueLoans.length > 0
              ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-rose-700">Em Atraso</span>
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{overdueLoans.length}</p>
          <p className="text-2xs text-rose-600 mt-1 font-medium">Prazo expirado</p>
        </div>

        {/* Reservas */}
        <div
          onClick={() => onNavigate('reservas')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-700">Reservas</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{activeReservations.length}</p>
          <p className="text-2xs text-amber-600 mt-1 font-medium">Fila de espera</p>
        </div>

        {/* Leitores */}
        <div
          onClick={() => onNavigate('leitores')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-700">Leitores</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{leitores.length}</p>
          <p className="text-2xs text-slate-700 mt-1">
            {blockedReaders.length > 0 ? `${blockedReaders.length} bloqueado(s)` : 'Todos ativos'}
          </p>
        </div>
      </div>

      {/* Quick Scanner & Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Barcode className="w-4 h-4 text-indigo-600" />
              Terminal Rápido de Leitura de Código de Barras / ID Único
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Digite ou bipe o ID único do exemplar físico (Formato: &lt;INICIAIS&gt;&lt;nnn&gt;-&lt;seq&gt;, ex: CX001-1, AK001-2)
            </p>
          </div>

          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                id="input-barcode-scanner"
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Ex: CX001-1 ou AK001-1..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-medium rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase bg-slate-50"
              />
              <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
            >
              Consultar
            </button>
          </form>
        </div>

        {/* Scan feedback result */}
        {scanResult && (
          <div
            className={`mt-4 p-3 rounded-lg flex items-center justify-between text-xs animate-in fade-in duration-150 ${
              scanResult.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : scanResult.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
            }`}
          >
            <span>{scanResult.message}</span>
            {scanResult.action && (
              <button
                onClick={scanResult.action}
                className="px-3 py-1 text-2xs font-bold rounded bg-white shadow-2xs border border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                {scanResult.actionLabel} &rarr;
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Two Column Section: Active Loans & Recent Titles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active loans table / status monitor */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Empréstimos em Andamento</h3>
              </div>
              <button
                onClick={() => onNavigate('circulacao')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Ver todos ({activeLoans.length}) &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {activeLoans.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhum empréstimo ativo no momento.
                </div>
              ) : (
                activeLoans.slice(0, 4).map((loan) => {
                  const exemplar = exemplares.find((e) => e.id_exemplar === loan.id_exemplar);
                  const titulo = exemplar ? titulos.find((t) => t.id_titulo === exemplar.id_titulo) : null;
                  const leitor = leitores.find((l) => l.id_leitor === loan.id_leitor);

                  return (
                    <div key={loan.id_emprestimo} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Traffic light status */}
                        <div
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            loan.atraso
                              ? 'bg-rose-500 animate-pulse'
                              : 'bg-emerald-500'
                          }`}
                          title={loan.atraso ? `Atrasado em ${loan.dias_atraso} dias` : 'No prazo'}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {titulo?.titulo_de_livro || loan.id_exemplar}
                          </p>
                          <div className="flex items-center gap-2 text-2xs text-slate-500">
                            <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-700">
                              {loan.id_exemplar}
                            </span>
                            <span>•</span>
                            <span className="truncate">{leitor?.nome_do_leitor || `Leitor #${loan.id_leitor}`}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-2xs font-bold px-2 py-0.5 rounded-full ${
                            loan.atraso
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {loan.atraso ? `Venceu há ${loan.dias_atraso}d` : `Previsto: ${new Date(loan.data_prevista_devolucao).toLocaleDateString('pt-BR')}`}
                        </span>
                        <div className="mt-1">
                          <button
                            onClick={() => handleQuickReturn(loan.id_exemplar)}
                            className="text-2xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Devolver &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> No Prazo
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Próximo (≤2d)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Em Atraso
              </span>
            </div>
            <span>Renovação permitida 1x</span>
          </div>
        </div>

        {/* Acervo Destaques & Quick Catalog */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Obras em Destaque no Acervo</h3>
              </div>
              <button
                onClick={() => onNavigate('titulos')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Gerenciar Acervo &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              {titulos.slice(0, 4).map((t) => {
                const copies = exemplares.filter((e) => e.id_titulo === t.id_titulo);
                const avail = copies.filter((e) => e.status === 'Disponivel').length;
                return (
                  <div
                    key={t.id_titulo}
                    className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 bg-slate-50/50 transition-all flex items-start gap-2.5"
                  >
                    {t.capa_url ? (
                      <img
                        src={t.capa_url}
                        alt={t.titulo_de_livro}
                        referrerPolicy="no-referrer"
                        className="w-10 h-14 object-cover rounded shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-indigo-100 text-indigo-700 rounded flex items-center justify-center font-bold text-2xs shrink-0">
                        {t.id_titulo}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-2xs font-mono font-bold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded">
                        {t.id_titulo}
                      </span>
                      <p className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                        {t.titulo_de_livro}
                      </p>
                      <p className="text-2xs text-slate-500 truncate">{t.autor}</p>
                      <p className="text-2xs font-medium text-emerald-600 mt-1">
                        {avail}/{copies.length} disponível(is)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
            <span>Máscara de ID único: &lt;INICIAIS&gt;&lt;nnn&gt;</span>
            <span className="text-indigo-600 font-medium cursor-pointer" onClick={() => onNavigate('titulos')}>
              + Adicionar Obra
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
