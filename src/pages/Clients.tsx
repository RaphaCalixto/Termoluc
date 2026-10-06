import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Wrench,
  ChevronRight,
  Edit2,
  Trash2,
  Building2
} from 'lucide-react';
import { Client, Equipment } from '../types';
import { getClients, getEquipment, deleteClient, subscribeToDataChanges } from '../services/db';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';

export const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modais
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cData, eData] = await Promise.all([
        getClients(),
        getEquipment(),
      ]);
      setClients(cData);
      setEquipment(eData);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataChanges(() => {
      loadData();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.document && c.document.toLowerCase().includes(q)) ||
      c.address.toLowerCase().includes(q)
    );
  });

  const getClientEquipmentCount = (clientId: string) => {
    return equipment.filter(e => e.client_id === clientId).length;
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    try {
      setDeleting(true);
      await deleteClient(clientToDelete.id);
      success(`Cliente "${clientToDelete.name}" e equipamentos vinculados foram excluídos.`);
      setDeleteModalOpen(false);
      setClientToDelete(null);
      await loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao excluir cliente.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gerenciamento completo de empresas e clientes atendidos pela Termoluc
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingClient(null);
            setFormModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-termoluc-600 hover:bg-termoluc-700 text-white text-xs font-bold shadow-sm shadow-termoluc-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Novo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 ml-1" />
        <input
          type="text"
          placeholder="Pesquisar por nome do cliente, telefone, e-mail, CPF/CNPJ ou endereço..."
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

      {/* Clients Grid */}
      {loading ? (
        <LoadingSpinner message="Carregando clientes..." />
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const equipCount = getClientEquipmentCount(client.id);

            return (
              <div
                key={client.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-termoluc-300 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Header & Image */}
                <div className="p-5">
                  <div className="flex items-start gap-3.5 mb-3.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center text-termoluc-700 font-bold text-base">
                      {client.image_url ? (
                        <img
                          src={client.image_url}
                          alt={client.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-termoluc-600" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        onClick={() => navigate(`/clients/${client.id}`)}
                        className="text-sm font-bold text-slate-900 hover:text-termoluc-600 cursor-pointer transition-colors truncate"
                      >
                        {client.name}
                      </h3>
                      {client.document && (
                        <p className="text-[11px] text-slate-400">{client.document}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-termoluc-50 text-termoluc-700 text-[10px] font-bold border border-termoluc-100">
                          <Wrench className="w-3 h-3" />
                          {equipCount} {equipCount === 1 ? 'equipamento' : 'equipamentos'}
                        </span>
                        {client.created_by && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                            ADM: {client.created_by}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-slate-500 leading-snug">
                        {client.address}
                        {(client.address_2 || client.address_3) && (
                          <span className="text-termoluc-600 font-semibold block text-[11px] mt-0.5">
                            + {Boolean(client.address_2) && Boolean(client.address_3) ? '2 endereços adicionais' : '1 endereço adicional'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingClient(client);
                        setFormModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-termoluc-600 hover:bg-termoluc-50 rounded-lg transition-colors"
                      title="Editar cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClientToDelete(client);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-termoluc-400 text-slate-700 hover:text-termoluc-700 text-xs font-semibold shadow-2xs transition-all"
                  >
                    <span>Ver Detalhes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description={
            searchQuery
              ? `Nenhum resultado para "${searchQuery}". Tente outros termos.`
              : 'Comece cadastrando o primeiro cliente no sistema.'
          }
          actionText="Novo Cliente"
          onAction={() => {
            setEditingClient(null);
            setFormModalOpen(true);
          }}
        />
      )}

      {/* Modal de Formulário */}
      <ClientFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        client={editingClient}
        onSuccess={() => loadData()}
      />

      {/* Modal de Exclusão */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente? Todos os equipamentos vinculados também serão removidos."
        itemName={clientToDelete?.name}
        loading={deleting}
      />
    </div>
  );
};
