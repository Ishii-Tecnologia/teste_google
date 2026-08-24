import React from 'react';
import {
  LayoutDashboard,
  BookMarked,
  Layers,
  Repeat,
  Bookmark,
  Users,
  BarChart3,
  History,
  Sliders,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { UsuarioSistema, PerfilUsuario } from '../types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UsuarioSistema;
  activeOverdueCount?: number;
  activeReservasCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  activeOverdueCount = 0,
  activeReservasCount = 0,
}) => {
  const role = currentUser.perfil;

  // RBAC permission check helper
  const canAccess = (allowedRoles: string[]) => {
    return (
      allowedRoles.includes(role) ||
      (role === 'Administrador' && allowedRoles.includes('ADMIN')) ||
      (role === 'ADMIN' && allowedRoles.includes('Administrador')) ||
      (role === 'Operador' && (allowedRoles.includes('BIBLIOTECARIO') || allowedRoles.includes('ATENDENTE'))) ||
      (role === 'BIBLIOTECARIO' && allowedRoles.includes('Operador')) ||
      (role === 'ATENDENTE' && allowedRoles.includes('Operador'))
    );
  };

  const navSections = [
    {
      title: 'Principal',
      items: [
        {
          id: 'dashboard',
          label: 'Painel Geral',
          icon: LayoutDashboard,
          allowedRoles: ['ADMIN', 'BIBLIOTECARIO', 'ATENDENTE', 'CONSULTOR', 'Administrador', 'Operador', 'Leitor'],
        },
        {
          id: 'circulacao',
          label: 'Circulação & Empréstimos',
          icon: Repeat,
          badge: activeOverdueCount > 0 ? `${activeOverdueCount} atrasado(s)` : undefined,
          badgeColor: 'bg-rose-500 text-white animate-pulse',
          allowedRoles: ['ADMIN', 'BIBLIOTECARIO', 'ATENDENTE', 'Administrador', 'Operador'],
        },
        {
          id: 'reservas',
          label: 'Fila de Reservas',
          icon: Bookmark,
          badge: activeReservasCount > 0 ? `${activeReservasCount}` : undefined,
          badgeColor: 'bg-amber-500 text-white',
          allowedRoles: ['ADMIN', 'BIBLIOTECARIO', 'ATENDENTE', 'CONSULTOR', 'Administrador', 'Operador', 'Leitor'],
        },
      ],
    },
    {
      title: 'Gestão de Acervo',
      items: [
        {
          id: 'titulos',
          label: 'Títulos / Obras',
          icon: BookMarked,
          allowedRoles: ['ADMIN', 'BIBLIOTECARIO', 'ATENDENTE', 'CONSULTOR', 'Administrador', 'Operador', 'Leitor'],
        },
        {
          id: 'exemplares',
          label: 'Exemplares Físicos',
          icon: Layers,
          allowedRoles: ['ADMIN', 'BIBLIOTECARIO', 'ATENDENTE', 'CONSULTOR', 'Administrador', 'Operador', 'Leitor'],
        },
        {
          id: 'leitores',
          label: 'Cadastro de Leitores',
          icon: Users,
          allowedRoles: ['ADMIN', 'BIBLIOTECARIO', 'ATENDENTE', 'Administrador', 'Operador'],
        },
      ],
    },
    {
      title: 'Inteligência & Auditoria',
      items: [
        {
          id: 'relatorios',
          label: 'Relatórios Gerenciais',
          icon: BarChart3,
          allowedRoles: ['ADMIN', 'BIBLIOTECARIO', 'CONSULTOR', 'Administrador', 'Operador'],
        },
        {
          id: 'historico',
          label: 'Log de Auditoria',
          icon: History,
          allowedRoles: ['ADMIN', 'BIBLIOTECARIO', 'CONSULTOR', 'Administrador', 'Operador'],
        },
      ],
    },
    {
      title: 'Administração do Sistema',
      items: [
        {
          id: 'parametros',
          label: 'Configurar Parâmetros',
          icon: Sliders,
          allowedRoles: ['ADMIN', 'Administrador'],
        },
        {
          id: 'usuarios',
          label: 'Controle de Acessos (RBAC)',
          icon: ShieldCheck,
          allowedRoles: ['ADMIN', 'Administrador'],
        },
      ],
    },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 space-y-6">
      <nav className="space-y-6">
        {navSections.map((section, idx) => {
          const visibleItems = section.items.filter((item) => canAccess(item.allowedRoles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1.5">
              <h3 className="px-3 text-3xs font-bold text-slate-400 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-3xs font-bold px-1.5 py-0.5 rounded-full ${
                            item.badgeColor || 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Security Info Card */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 hidden md:block">
        <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sessão Autenticada</span>
        </div>
        <p className="text-3xs text-slate-500 leading-relaxed">
          Logado como <strong className="text-slate-700">@{currentUser.username || currentUser.login}</strong>. As permissões de gravação, exclusão e auditoria são validadas de acordo com seu perfil.
        </p>
      </div>
    </aside>
  );
};
