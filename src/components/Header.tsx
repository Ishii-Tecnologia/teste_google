import React, { useState } from 'react';
import {
  Shield,
  Key,
  User,
  Users,
  ChevronDown,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { UsuarioSistema, PerfilUsuario } from '../types';

interface HeaderProps {
  currentUser: UsuarioSistema;
  usuarios: UsuarioSistema[];
  onSwitchUser: (user: UsuarioSistema) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  usuarios,
  onSwitchUser,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleBadge = (perfil: PerfilUsuario) => {
    switch (perfil) {
      case 'ADMIN':
      case 'Administrador':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" /> Admin Master
          </span>
        );
      case 'BIBLIOTECARIO':
      case 'Operador':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Key className="w-3 h-3 text-indigo-600" /> Bibliotecário
          </span>
        );
      case 'ATENDENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <User className="w-3 h-3 text-emerald-600" /> Atendente Balcão
          </span>
        );
      case 'CONSULTOR':
      case 'Leitor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Users className="w-3 h-3 text-amber-600" /> Auditor / Consulta
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Institution Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-900 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-200">
              CEP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-none">
                  Biblioteca CEP
                </h1>
                <span className="text-3xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-2xs text-slate-500 mt-0.5 font-medium hidden sm:block">
                Centro Educacional Profissional • Gestão de Acervo & Circulação
              </p>
            </div>
          </div>

          {/* User Account / Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {(currentUser.nome_completo || currentUser.nome || currentUser.username || 'A')
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.nome_completo || currentUser.nome || currentUser.username}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getRoleBadge(currentUser.perfil)}
                </div>
              </div>

              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform ml-1" />
            </button>

            {/* Switch User Dropdown */}
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 border-b border-slate-100">
                  <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
                    Alternar Credencial / Perfil (RBAC)
                  </span>
                </div>

                <div className="space-y-1 py-1 max-h-64 overflow-y-auto">
                  {usuarios.map((u) => {
                    const isSelected = u.id_usuario === currentUser.id_usuario;
                    return (
                      <button
                        key={u.id_usuario}
                        onClick={() => {
                          onSwitchUser(u);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50 border border-indigo-200'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {u.nome_completo || u.nome || u.username}
                          </p>
                          <p className="text-3xs text-slate-500 font-mono">
                            Login: @{u.username || u.login}
                          </p>
                          <div className="mt-1">{getRoleBadge(u.perfil)}</div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-1 border-t border-slate-100 text-center">
                  <p className="text-3xs text-slate-400">
                    O controle de permissões ajusta menus e ações em tempo real.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
