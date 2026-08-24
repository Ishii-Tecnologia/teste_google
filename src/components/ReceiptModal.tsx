import React from 'react';
import { Printer, CheckCircle, X, BookOpen, User, Calendar, ShieldCheck } from 'lucide-react';
import { Emprestimo, Titulo, Exemplar, Leitor } from '../types';

interface ReceiptModalProps {
  data: {
    type: 'emprestimo' | 'devolucao';
    emprestimo: Emprestimo;
    titulo: Titulo;
    exemplar: Exemplar;
    leitor: Leitor;
    diasAtraso?: number;
  };
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ data, onClose }) => {
  const { type, emprestimo, titulo, exemplar, leitor, diasAtraso } = data;
  const isLoan = type === 'emprestimo';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-70 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-w-full">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold">
              {isLoan ? 'Comprovante Oficial de Empréstimo' : 'Comprovante Oficial de Devolução'}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg font-bold px-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 md:p-8 space-y-6 text-slate-800 font-sans" id="printable-receipt">
          {/* Header */}
          <div className="text-center border-b border-slate-300 pb-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-900 text-white font-black text-sm mb-2">
              CEP
            </div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
              Biblioteca CEP
            </h2>
            <p className="text-2xs text-slate-500">
              Centro Educacional Profissional • Sistema Integrado de Gestão Bibliotecária
            </p>
            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-slate-100 text-xs font-mono font-bold text-slate-800 border border-slate-200">
              {isLoan ? 'RECIBO DE RETIRADA / EMPRÉSTIMO' : 'RECIBO DE DEVOLUÇÃO FÍSICA'}
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
            <div>
              <span className="text-2xs text-slate-500 block">Nº TRANSAÇÃO:</span>
              <span className="font-bold text-slate-900">#EMP-{emprestimo.id_emprestimo}</span>
            </div>
            <div className="text-right">
              <span className="text-2xs text-slate-500 block">DATA / HORA:</span>
              <span className="font-bold text-slate-900">{new Date().toLocaleString('pt-BR')}</span>
            </div>
          </div>

          {/* Reader Section */}
          <div className="space-y-1.5">
            <h5 className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Identificação do Leitor / Usuário
            </h5>
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1 text-xs">
              <p className="font-bold text-slate-900">{leitor.nome_do_leitor}</p>
              <p className="text-2xs text-slate-600">Matrícula: #{leitor.id_leitor} {leitor.cpf && `• CPF: ${leitor.cpf}`}</p>
              <p className="text-2xs text-slate-600">E-mail: {leitor.email} {leitor.telefone && `• Tel: ${leitor.telefone}`}</p>
            </div>
          </div>

          {/* Book / Copy Section */}
          <div className="space-y-1.5">
            <h5 className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Dados da Obra e Exemplar
            </h5>
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1 text-xs">
              <p className="font-bold text-slate-900">{titulo.titulo_de_livro}</p>
              <p className="text-2xs text-slate-600">Autor(a): {titulo.autor} • Categoria: {titulo.categoria}</p>
              <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between">
                <span className="text-2xs text-slate-500">Código do Exemplar:</span>
                <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-indigo-900">
                  {exemplar.id_exemplar}
                </span>
              </div>
            </div>
          </div>

          {/* Dates & Deadlines */}
          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Data de Retirada:</span>
              <span className="font-bold font-mono text-slate-900">
                {new Date(emprestimo.data_emprestimo).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-600">Prazo Previsto de Devolução:</span>
              <span className="font-bold font-mono text-indigo-900">
                {new Date(emprestimo.data_prevista_devolucao).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {!isLoan && emprestimo.data_devolucao_real && (
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-600 font-bold">Devolução Efetiva:</span>
                <span className="font-bold font-mono text-emerald-700">
                  {new Date(emprestimo.data_devolucao_real).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}

            {!isLoan && diasAtraso !== undefined && diasAtraso > 0 && (
              <div className="flex justify-between text-rose-700 font-bold pt-1">
                <span>Atraso Computado:</span>
                <span>{diasAtraso} dia(s)</span>
              </div>
            )}
          </div>

          {/* Terms & Signatures */}
          {isLoan ? (
            <div className="space-y-4 pt-2">
              <p className="text-3xs text-slate-500 leading-tight text-justify">
                Declaro ter recebido o exemplar acima identificado em perfeitas condições de uso e conservação, comprometendo-me a restituí-lo rigorosamente até a data prevista. Estou ciente de que o atraso acarretará no bloqueio automático do meu cadastro.
              </p>
              <div className="pt-8 border-t border-dashed border-slate-400 flex flex-col items-center">
                <p className="text-2xs font-semibold text-slate-700">{leitor.nome_do_leitor}</p>
                <p className="text-3xs text-slate-400">Assinatura do Leitor</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <p className="text-3xs text-slate-500 leading-tight text-justify">
                O operador atesta a devolução física do exemplar e a liberação cadastral do leitor.
              </p>
              <div className="pt-6 border-t border-dashed border-slate-400 flex flex-col items-center">
                <p className="text-2xs font-semibold text-slate-700">Biblioteca CEP — Circulação</p>
                <p className="text-3xs text-slate-400">Carimbo / Assinatura do Atendente</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer (Hidden on print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Fechar Comprovante
          </button>
        </div>
      </div>
    </div>
  );
};
