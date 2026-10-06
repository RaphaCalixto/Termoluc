import React from 'react';
import { Menu, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenNewOS?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenNewOS,
  onRefresh,
  refreshing = false,
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Toggle & Breadcrumb/Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="lg:hidden flex items-center gap-2">
            <img src="/TERMOLUC_logo.png" alt="Termoluc" className="h-6 object-contain" />
            <span className="font-bold text-slate-800 text-sm">TERMOLUC</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sistema Online • Base de Dados Compartilhada</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className={`p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all ${
                refreshing ? 'animate-spin text-termoluc-600' : ''
              }`}
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {onOpenNewOS && (
            <button
              type="button"
              onClick={onOpenNewOS}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-termoluc-600 hover:bg-termoluc-700 text-white text-xs font-semibold shadow-xs shadow-termoluc-200 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova OS</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          {/* User Badge */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-full bg-termoluc-100 border border-termoluc-200 text-termoluc-800 flex items-center justify-center text-xs font-bold">
              {user?.name ? user.name.charAt(0) : 'A'}
            </div>
            <div className="hidden md:block text-left leading-none">
              <span className="text-xs font-semibold text-slate-700 block">{user?.name}</span>
              <span className="text-[10px] text-slate-400">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
