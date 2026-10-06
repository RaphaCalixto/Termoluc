import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { subscribeToDataChanges } from '../../services/db';
import { useToast } from '../../context/ToastContext';

interface LayoutProps {
  onOpenNewOS?: () => void;
  onOpenNewClient?: () => void;
  onRefreshGlobal?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  onOpenNewOS,
  onOpenNewClient,
  onRefreshGlobal,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { info } = useToast();

  useEffect(() => {
    // Escuta sincronizações em tempo real entre abas / administradores
    const unsubscribe = subscribeToDataChanges((entity) => {
      if (entity === 'clients') info('Dados de clientes sincronizados.');
      if (entity === 'orders') info('Ordens de serviço atualizadas na base compartilhada.');
      if (entity === 'equipment') info('Equipamentos atualizados.');
      if (onRefreshGlobal) onRefreshGlobal();
    });
    return () => unsubscribe();
  }, [onRefreshGlobal, info]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefreshGlobal) await onRefreshGlobal();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenNewOS={onOpenNewOS}
        onOpenNewClient={onOpenNewClient}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          onToggleSidebar={() => setMobileOpen(!mobileOpen)}
          onOpenNewOS={onOpenNewOS}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
