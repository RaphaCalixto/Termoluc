import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Plus,
  Filter,
  User,
  Wrench,
  Building2,
  Eye,
  Edit2,
  Trash2,
  Camera
} from 'lucide-react';
import { ServiceOrder, Client, Technician, ServiceOrderImage } from '../types';
import {
  getServiceOrders,
  getClients,
  getTechnicians,
  deleteServiceOrder,
} from '../services/db';
import { ServiceOrderFormModal } from '../components/orders/ServiceOrderFormModal';
import { ServiceOrderDetailsModal } from '../components/orders/ServiceOrderDetailsModal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';

export const ServiceOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error } = useToast();

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [clientFilter, setClientFilter] = useState<string>(searchParams.get('client') || '');
  const [techFilter, setTechFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<ServiceOrder | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<ServiceOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [oData, cData, tData] = await Promise.all([
        getServiceOrders(),
        getClients(),
        getTechnicians(),
      ]);
      setOrders(oData);
      setClients(cData);
      setTechnicians(tData);
    } catch (err) {
      console.error('Erro ao carregar Ordens de Serviço:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sincroniza query params
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) setStatusFilter(statusParam);
  }, [searchParams]);

  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order.order_number.toLowerCase().includes(q) ||
      (order.client?.name && order.client.name.toLowerCase().includes(q)) ||
      (order.technician?.name && order.technician.name.toLowerCase().includes(q)) ||
      (order.equipment?.brand && order.equipment.brand.toLowerCase().includes(q)) ||
      (order.equipment?.model && order.equipment.model.toLowerCase().includes(q)) ||
      order.description.toLowerCase().includes(q);

    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesClient = !clientFilter || order.client_id === clientFilter;
    const matchesTech = !techFilter || order.technician_id === techFilter;
    const matchesDate = !dateFilter || order.service_date.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesClient && matchesTech && matchesDate;
  });

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    try {
      setDeleting(true);
      await deleteServiceOrder(orderToDelete.id);
      success(`Ordem de Serviço ${orderToDelete.order_number} excluída.`);
      setDeleteModalOpen(false);
      setOrderToDelete(null);
      await loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao excluir OS.');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setClientFilter('');
    setTechFilter('');
    setDateFilter('');
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Ordens de Serviço (OS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Controle de execuções, manutenções preventivas, corretivas e histórico técnico
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingOrder(null);
            setFormModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-termoluc-600 hover:bg-termoluc-700 text-white text-xs font-bold shadow-sm shadow-termoluc-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nova Ordem de Serviço
        </button>
      </div>

      {/* Multi-Filters & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Pesquisar por número da OS (ex: OS-2026-1001), cliente, técnico, equipamento ou serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filtrar por:
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-termoluc-500 cursor-pointer font-medium"
          >
            <option value="">Todos os Status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluída">Concluída</option>
            <option value="Cancelada">Cancelada</option>
          </select>

          {/* Cliente */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-termoluc-500 cursor-pointer max-w-xs truncate"
          >
            <option value="">Todos os Clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Técnico */}
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-termoluc-500 cursor-pointer"
          >
            <option value="">Todos os Técnicos</option>
            {technicians.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Período / Data */}
          <input
            type="month"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-termoluc-500 cursor-pointer"
            title="Filtrar por Mês / Ano"
          />

          {(statusFilter || clientFilter || techFilter || dateFilter) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-termoluc-600 hover:underline font-semibold ml-auto"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Orders List / Cards */}
      {loading ? (
        <LoadingSpinner message="Carregando Ordens de Serviço..." />
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-termoluc-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Bar: OS Number, Status & Action buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-termoluc-50 text-termoluc-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900">
                          {order.order_number}
                        </span>
                        <StatusBadge status={order.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-400">
                        Executada em: <strong className="text-slate-700">{new Date(order.service_date).toLocaleDateString('pt-BR')}</strong>
                        {order.created_by && (
                          <span className="ml-2 text-termoluc-600 font-medium">• ADM: <strong className="text-slate-700">{order.created_by}</strong></span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForDetails(order)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-termoluc-50 hover:bg-termoluc-100 text-termoluc-700 text-xs font-bold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Detalhes
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingOrder(order);
                        setFormModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-termoluc-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Editar OS"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOrderToDelete(order);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir OS"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Middle Info: Client, Equipment, Technician */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-termoluc-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {order.clients && order.clients.length > 1 ? 'Clientes Vinculados' : 'Cliente'}
                      </span>
                      <span className="font-bold text-slate-800 truncate block">
                        {order.clients && order.clients.length > 0
                          ? order.clients.map(c => c.name).join(' & ')
                          : (order.client?.name || 'Cliente')}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                    <Wrench className="w-4 h-4 text-termoluc-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Equipamento</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {order.equipment ? `${order.equipment.type} (${order.equipment.brand})` : 'Serviço Geral'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                    <User className="w-4 h-4 text-termoluc-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Técnico Responsável</span>
                      <span className="font-semibold text-slate-800 truncate block">{order.technician?.name || 'Não inf.'}</span>
                    </div>
                  </div>
                </div>

                {/* Description snippet */}
                <p className="text-xs sm:text-sm text-slate-700 bg-slate-50/60 p-3 rounded-xl border border-slate-100 line-clamp-2 leading-relaxed">
                  {order.description}
                </p>

                {/* Photos mini-preview */}
                {order.images && order.images.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      {order.images.length} foto(s) anexada(s)
                    </span>
                    <div className="flex gap-1.5">
                      {order.images.map((img: ServiceOrderImage, i: number) => (
                        <div
                          key={i}
                          onClick={() => setSelectedOrderForDetails(order)}
                          className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80"
                        >
                          <img src={img.image_url} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="Nenhuma Ordem de Serviço encontrada"
          description={
            searchQuery || statusFilter || clientFilter || techFilter || dateFilter
              ? 'Nenhuma OS corresponde aos filtros selecionados.'
              : 'Comece criando a primeira Ordem de Serviço.'
          }
          actionText="Nova Ordem de Serviço"
          onAction={() => {
            setEditingOrder(null);
            setFormModalOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <ServiceOrderFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        order={editingOrder}
        onSuccess={() => loadData()}
      />

      <ServiceOrderDetailsModal
        isOpen={Boolean(selectedOrderForDetails)}
        onClose={() => setSelectedOrderForDetails(null)}
        order={selectedOrderForDetails}
        onEdit={(ord: ServiceOrder) => {
          setSelectedOrderForDetails(null);
          setEditingOrder(ord);
          setFormModalOpen(true);
        }}
        onDelete={(ord: ServiceOrder) => {
          setSelectedOrderForDetails(null);
          setOrderToDelete(ord);
          setDeleteModalOpen(true);
        }}
        onStatusChange={() => loadData()}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Ordem de Serviço"
        message="Tem certeza que deseja excluir esta Ordem de Serviço da base compartilhada?"
        itemName={orderToDelete ? `${orderToDelete.order_number} - ${orderToDelete.client?.name}` : ''}
        loading={deleting}
      />
    </div>
  );
};
