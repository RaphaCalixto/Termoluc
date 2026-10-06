import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ClientDetails } from './pages/ClientDetails';
import { EquipmentPage } from './pages/EquipmentPage';
import { ServiceOrdersPage } from './pages/ServiceOrdersPage';
import { TechniciansPage } from './pages/TechniciansPage';
import { SettingsPage } from './pages/SettingsPage';

import { ServiceOrderFormModal } from './components/orders/ServiceOrderFormModal';
import { ClientFormModal } from './components/clients/ClientFormModal';
import { ServiceOrderDetailsModal } from './components/orders/ServiceOrderDetailsModal';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ServiceOrder, Client } from './types';

// Componente para rotas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner message="Verificando credenciais do administrador..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente principal do App após autenticação
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  // Modais globais (abertos via Navbar, Sidebar, Dashboard)
  const [globalOSModalOpen, setGlobalOSModalOpen] = useState(false);
  const [globalClientModalOpen, setGlobalClientModalOpen] = useState(false);
  const [globalSelectedOS, setGlobalSelectedOS] = useState<ServiceOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);

  // Key para forçar refresh dos componentes quando dados mudam
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout
                onOpenNewOS={() => {
                  setEditingOrder(null);
                  setGlobalOSModalOpen(true);
                }}
                onOpenNewClient={() => setGlobalClientModalOpen(true)}
                onRefreshGlobal={handleDataRefresh}
              />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={
              <Dashboard
                key={refreshKey}
                onOpenNewOS={() => {
                  setEditingOrder(null);
                  setGlobalOSModalOpen(true);
                }}
                onOpenNewClient={() => setGlobalClientModalOpen(true)}
                onSelectOrder={(ord) => setGlobalSelectedOS(ord)}
              />
            }
          />
          <Route path="/clients" element={<Clients key={refreshKey} />} />
          <Route path="/clients/:id" element={<ClientDetails key={refreshKey} />} />
          <Route path="/equipment" element={<EquipmentPage key={refreshKey} />} />
          <Route path="/orders" element={<ServiceOrdersPage key={refreshKey} />} />
          <Route path="/technicians" element={<TechniciansPage key={refreshKey} />} />
          <Route path="/settings" element={<SettingsPage key={refreshKey} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Modais Globais */}
      <ServiceOrderFormModal
        isOpen={globalOSModalOpen}
        onClose={() => setGlobalOSModalOpen(false)}
        order={editingOrder}
        onSuccess={() => {
          handleDataRefresh();
          setGlobalOSModalOpen(false);
          setEditingOrder(null);
        }}
      />

      <ClientFormModal
        isOpen={globalClientModalOpen}
        onClose={() => setGlobalClientModalOpen(false)}
        onSuccess={(newClient: Client) => {
          handleDataRefresh();
          setGlobalClientModalOpen(false);
          navigate(`/clients/${newClient.id}`);
        }}
      />

      <ServiceOrderDetailsModal
        isOpen={Boolean(globalSelectedOS)}
        onClose={() => setGlobalSelectedOS(null)}
        order={globalSelectedOS}
        onEdit={(ord) => {
          setGlobalSelectedOS(null);
          setEditingOrder(ord);
          setGlobalOSModalOpen(true);
        }}
        onDelete={() => {
          setGlobalSelectedOS(null);
          handleDataRefresh();
        }}
        onStatusChange={() => {
          handleDataRefresh();
        }}
      />
    </>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
