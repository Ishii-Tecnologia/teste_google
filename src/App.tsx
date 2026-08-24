import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { TitulosView } from './components/TitulosView';
import { ExemplaresView } from './components/ExemplaresView';
import { CirculacaoView } from './components/CirculacaoView';
import { ReservasView } from './components/ReservasView';
import { LeitoresView } from './components/LeitoresView';
import { RelatoriosView } from './components/RelatoriosView';
import { HistoricoView } from './components/HistoricoView';
import { ParametrosView } from './components/ParametrosView';
import { UsuariosView } from './components/UsuariosView';
import { ReceiptModal } from './components/ReceiptModal';
import { storageService } from './services/storage';
import { libraryService } from './services/libraryService';
import {
  Titulo,
  Exemplar,
  Emprestimo,
  Leitor,
  Reserva,
  HistoricoMovimentacao,
  ParametroSistema,
  UsuarioSistema,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<UsuarioSistema>(storageService.getCurrentUser());

  // App state
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [exemplares, setExemplares] = useState<Exemplar[]>([]);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [leitores, setLeitores] = useState<Leitor[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [historico, setHistorico] = useState<HistoricoMovimentacao[]>([]);
  const [parametros, setParametros] = useState<ParametroSistema[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);

  // Navigation targets with parameters
  const [selectedExemplarForLoan, setSelectedExemplarForLoan] = useState<string | null>(null);
  const [selectedReaderFor360, setSelectedReaderFor360] = useState<number | null>(null);

  // Receipt Modal
  const [receiptData, setReceiptData] = useState<{
    type: 'emprestimo' | 'devolucao';
    emprestimo: Emprestimo;
    titulo: Titulo;
    exemplar: Exemplar;
    leitor: Leitor;
    diasAtraso?: number;
  } | null>(null);

  // Refresh all state from storage & run overdue checks
  const refreshAllData = useCallback(() => {
    libraryService.checkAndMarkOverdueLoans();
    setTitulos(storageService.getTitulos());
    setExemplares(storageService.getExemplares());
    setEmprestimos(storageService.getEmprestimos());
    setLeitores(storageService.getLeitores());
    setReservas(storageService.getReservas());
    setHistorico(storageService.getHistorico());
    setParametros(storageService.getParametros());
    setUsuarios(storageService.getUsuarios());
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Switch Current User / Role
  const handleSwitchUser = (newUser: UsuarioSistema) => {
    storageService.setCurrentUser(newUser);
    setCurrentUser(newUser);
    refreshAllData();
  };

  // Quick Action: Empréstimo a partir de um exemplar físico
  const handleLoanExemplar = (id_exemplar: string) => {
    setSelectedExemplarForLoan(id_exemplar);
    setActiveTab('circulacao');
  };

  // Quick Action: Converter Reserva em Empréstimo
  const handleConvertReservaToLoan = (id_titulo: string, id_leitor: number) => {
    const readyCopy = exemplares.find(
      (e) => e.id_titulo === id_titulo && (e.status === 'Reservado' || e.status === 'Disponivel')
    );
    if (readyCopy) {
      setSelectedExemplarForLoan(readyCopy.id_exemplar);
    }
    setActiveTab('circulacao');
  };

  // Quick Action: Ver Visão 360 do leitor
  const handleViewReader360 = (id_leitor: number) => {
    setSelectedReaderFor360(id_leitor);
    setActiveTab('relatorios');
  };

  // Quick Action: Novo Empréstimo
  const handleOpenNewLoan = () => {
    setSelectedExemplarForLoan(null);
    setActiveTab('circulacao');
  };

  // Quick Action: Devolução Rápida
  const handleOpenQuickReturn = (exemplarId?: string) => {
    if (exemplarId) {
      setSelectedExemplarForLoan(exemplarId);
    }
    setActiveTab('circulacao');
  };

  const handleNavigate = (tab: string) => {
    if (tab === 'emprestimos') {
      setActiveTab('circulacao');
    } else {
      if (tab !== 'circulacao') setSelectedExemplarForLoan(null);
      if (tab !== 'relatorios') setSelectedReaderFor360(null);
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        usuarios={usuarios}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 gap-6">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleNavigate}
          currentUser={currentUser}
          activeOverdueCount={emprestimos.filter((e) => !e.data_devolucao_real && e.atraso).length}
          activeReservasCount={reservas.filter((r) => r.status_reserva === 'Ativa').length}
        />

        {/* View Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              titulos={titulos}
              exemplares={exemplares}
              emprestimos={emprestimos}
              leitores={leitores}
              reservas={reservas}
              historico={historico}
              onNavigate={handleNavigate}
              onRefresh={refreshAllData}
              onOpenReceipt={setReceiptData}
              onOpenNewLoan={handleOpenNewLoan}
              onOpenQuickReturn={handleOpenQuickReturn}
            />
          )}

          {activeTab === 'circulacao' && (
            <CirculacaoView
              emprestimos={emprestimos}
              exemplares={exemplares}
              titulos={titulos}
              leitores={leitores}
              reservas={reservas}
              onRefresh={refreshAllData}
              onOpenReceipt={setReceiptData}
              initialSelectedExemplarId={selectedExemplarForLoan}
            />
          )}

          {activeTab === 'titulos' && (
            <TitulosView
              titulos={titulos}
              exemplares={exemplares}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'exemplares' && (
            <ExemplaresView
              exemplares={exemplares}
              titulos={titulos}
              onRefresh={refreshAllData}
              onLoanExemplar={handleLoanExemplar}
            />
          )}

          {activeTab === 'reservas' && (
            <ReservasView
              reservas={reservas}
              titulos={titulos}
              leitores={leitores}
              exemplares={exemplares}
              onRefresh={refreshAllData}
              onConvertReservaToLoan={handleConvertReservaToLoan}
            />
          )}

          {activeTab === 'leitores' && (
            <LeitoresView
              leitores={leitores}
              emprestimos={emprestimos}
              titulos={titulos}
              exemplares={exemplares}
              onRefresh={refreshAllData}
              onViewReader360={handleViewReader360}
            />
          )}

          {activeTab === 'relatorios' && (
            <RelatoriosView
              titulos={titulos}
              exemplares={exemplares}
              emprestimos={emprestimos}
              leitores={leitores}
              reservas={reservas}
              historico={historico}
              initialSelectedReaderId={selectedReaderFor360}
            />
          )}

          {activeTab === 'historico' && (
            <HistoricoView
              historico={historico}
              exemplares={exemplares}
              titulos={titulos}
              leitores={leitores}
            />
          )}

          {activeTab === 'parametros' && (
            <ParametrosView
              parametros={parametros}
              onRefresh={refreshAllData}
              currentUsername={currentUser.username}
            />
          )}

          {activeTab === 'usuarios' && (
            <UsuariosView
              usuarios={usuarios}
              currentUser={currentUser}
              onRefresh={refreshAllData}
              onSwitchUser={handleSwitchUser}
            />
          )}
        </main>
      </div>

      {/* Official Receipt Modal (Printable) */}
      {receiptData && (
        <ReceiptModal
          data={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  );
}
