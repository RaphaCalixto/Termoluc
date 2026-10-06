import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wrench,
  FileText,
  UserCog,
  Settings,
  PlusCircle,
  LogOut,
  ChevronRight,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  onOpenNewOS?: () => void;
  onOpenNewClient?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  setMobileOpen,
  onOpenNewOS,
  onOpenNewClient,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clientes', path: '/clients', icon: Users },
    { name: 'Equipamentos', path: '/equipment', icon: Wrench },
    { name: 'Ordens de Serviço', path: '/orders', icon: FileText },
    { name: 'Técnicos', path: '/technicians', icon: UserCog },
    { name: 'Configurações', path: '/settings', icon: Settings },
  ];

  const handleLinkClick = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo / Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-termoluc-600/20 border border-termoluc-500/30 flex items-center justify-center overflow-hidden p-1">
            <img src="/TERMOLUC_logo.png" alt="Termoluc" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-white tracking-wider text-base">TERMOLUC</h1>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-termoluc-500/20 text-termoluc-400 border border-termoluc-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Refrigeração & Climatização</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-3.5 space-y-2">
          <button
            onClick={() => {
              if (onOpenNewOS) onOpenNewOS();
              handleLinkClick();
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-termoluc-600 hover:bg-termoluc-500 text-white font-semibold text-xs transition-all shadow-md shadow-termoluc-900/40 active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            Nova Ordem de Serviço
          </button>
          {onOpenNewClient && (
            <button
              onClick={() => {
                onOpenNewClient();
                handleLinkClick();
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-all active:scale-98"
            >
              <Users className="w-3.5 h-3.5 text-termoluc-400" />
              Cadastrar Cliente
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Principal
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-termoluc-600/20 text-termoluc-300 border border-termoluc-500/30 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </NavLink>
            );
          })}
        </nav>

        {/* Base Compartilhada Info Badge */}
        <div className="px-3.5 py-2">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-termoluc-400 flex-shrink-0" />
            <div className="leading-tight">
              <p className="font-semibold text-slate-300">Base Centralizada</p>
              <p className="text-[10px] text-slate-400">Banco de Dados Supabase</p>
            </div>
          </div>
        </div>

        {/* Admin Profile Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-termoluc-600 border border-termoluc-400/30 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {user?.name ? user.name.charAt(0) : 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Alesandro'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'termolucarcondicionado@gmail.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
              title="Sair do sistema"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
