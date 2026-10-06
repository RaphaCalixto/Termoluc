import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Wrench,
  CheckCircle,
  Clock,
  Calendar,
  PlusCircle,
  FileText,
  ArrowRight,
  TrendingUp,
  Building2,
  Phone,
  Eye
} from 'lucide-react';
import { getDashboardMetrics, getServiceOrders, getClients } from '../services/db';
import { DashboardMetrics, ServiceOrder, Client } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface DashboardProps {
  onOpenNewOS: () => void;
  onOpenNewClient: () => void;
  onSelectOrder: (order: ServiceOrder) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenNewOS,
  onOpenNewClient,
  onSelectOrder,
}) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<ServiceOrder[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [m, orders, clients] = await Promise.all([
        getDashboardMetrics(),
        getServiceOrders(),
        getClients(),
      ]);
      setMetrics(m);
      setRecentOrders(orders.slice(0, 5));
      setRecentClients(clients.slice(0, 4));
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !metrics) {
    return <LoadingSpinner message="Carregando indicadores do sistema..." />;
  }

  const metricCards = [
    {
      title: 'Total de Clientes',
      value: metrics.totalClients,
      icon: Users,
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/clients',
    },
    {
      title: 'Equipamentos Ativos',
      value: metrics.totalEquipment,
      icon: Wrench,
      textColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      path: '/equipment',
    },
    {
      title: 'OS do Mês',
      value: metrics.monthOrders,
      icon: Calendar,
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      path: '/orders',
    },
    {
      title: 'OS Realizadas',
      value: metrics.completedOrders,
      icon: CheckCircle,
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      path: '/orders?status=Concluída',
    },
    {
      title: 'OS Pendentes',
      value: metrics.pendingOrders,
      icon: Clock,
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      path: '/orders?status=Pendente',
    },
    {
      title: 'OS em Andamento',
      value: metrics.inProgressOrders,
      icon: TrendingUp,
      textColor: 'text-sky-600',
      bgColor: 'bg-sky-50',
      path: '/orders?status=Em andamento',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-termoluc-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-termoluc-500/30 text-termoluc-300 border border-termoluc-400/30 text-xs font-bold uppercase tracking-wider">
                Painel Geral
              </span>
              <span className="text-xs text-slate-400">Termoluc Refrigeração</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Visão Geral das Operações
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Base de dados compartilhada para acompanhamento centralizado de clientes, maquinários e serviços em tempo real.
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewOS}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-termoluc-500 hover:bg-termoluc-400 text-white text-xs font-bold shadow-lg shadow-termoluc-950/50 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Nova OS
            </button>
            <button
              onClick={onOpenNewClient}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all active:scale-95"
            >
              <Users className="w-4 h-4" />
              Novo Cliente
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all"
            >
              <FileText className="w-4 h-4" />
              Ordens de Serviço
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.path)}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-termoluc-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${card.bgColor} ${card.textColor} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent OS + Recent Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Service Orders (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Ordens de Serviço Recentes</h2>
              <p className="text-xs text-slate-500">Últimos atendimentos técnicos e manutenções registradas</p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs font-bold text-termoluc-600 hover:text-termoluc-700 inline-flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentOrders.length > 0 ? (
              recentOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-termoluc-50 text-termoluc-600 flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:bg-termoluc-600 group-hover:text-white transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{order.order_number}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-semibold text-xs text-slate-700 truncate">
                          {order.client?.name || 'Cliente'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {order.description}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Técnico: <strong>{order.technician?.name || 'Não inf.'}</strong></span>
                        {order.equipment && (
                          <span>Equipamento: <strong>{order.equipment.type} ({order.equipment.brand})</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <StatusBadge status={order.status} size="sm" />
                    <span className="text-[10px] text-slate-400">
                      {new Date(order.service_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhuma Ordem de Serviço cadastrada.
              </div>
            )}
          </div>
        </div>

        {/* Recent Clients (1 Col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Clientes Cadastrados</h2>
              <p className="text-xs text-slate-500">Acesso rápido aos clientes</p>
            </div>
            <button
              onClick={() => navigate('/clients')}
              className="text-xs font-bold text-termoluc-600 hover:text-termoluc-700 inline-flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentClients.map(client => (
              <div
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 hover:border-termoluc-200 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center text-termoluc-700 font-bold text-sm">
                    {client.image_url ? (
                      <img src={client.image_url} alt={client.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-termoluc-700 transition-colors">
                      {client.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      {client.phone}
                    </p>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-termoluc-600 group-hover:bg-termoluc-50 transition-colors flex-shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenNewClient}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:text-termoluc-700 hover:border-termoluc-400 hover:bg-termoluc-50/50 transition-all flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 text-termoluc-600" />
              Cadastrar Novo Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
