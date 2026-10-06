import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  FileText,
  Wrench,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  Building2,
  Info,
  Clock,
  Tag,
  Eye,
  Camera,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Client, Equipment, ServiceOrder, ServiceOrderImage } from '../types';
import {
  getClientById,
  getEquipmentByClientId,
  getServiceOrdersByClientId,
  deleteClient,
  deleteEquipment,
  deleteServiceOrder,
  subscribeToDataChanges,
} from '../services/db';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { EquipmentFormModal } from '../components/equipment/EquipmentFormModal';
import { ServiceOrderFormModal } from '../components/orders/ServiceOrderFormModal';
import { ServiceOrderDetailsModal } from '../components/orders/ServiceOrderDetailsModal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { StatusBadge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';

export const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab selection: 'equipments' | 'history'
  const [activeTab, setActiveTab] = useState<'equipments' | 'history'>('equipments');

  // Modais de Formulário
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [equipModalOpen, setEquipModalOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState<Equipment | null>(null);
  const [osModalOpen, setOsModalOpen] = useState(false);
  const [editingOS, setEditingOS] = useState<ServiceOrder | null>(null);
  const [selectedOSForDetails, setSelectedOSForDetails] = useState<ServiceOrder | null>(null);

  // Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'client' | 'equipment' | 'order'>('client');
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Photo Gallery Modal
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number | null>(null);

  const loadClientData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const c = await getClientById(id);
      if (!c) {
        error('Cliente não encontrado.');
        navigate('/clients');
        return;
      }
      setClient(c);
      const [eData, oData] = await Promise.all([
        getEquipmentByClientId(id),
        getServiceOrdersByClientId(id),
      ]);
      setEquipment(eData);
      setOrders(oData);
    } catch (err) {
      console.error('Erro ao carregar detalhes do cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
    const unsubscribe = subscribeToDataChanges(() => {
      loadClientData();
    });
    return () => {
      unsubscribe();
    };
  }, [id]);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      if (deleteType === 'client') {
        await deleteClient(itemToDelete.id);
        success(`Cliente excluído com sucesso.`);
        navigate('/clients');
      } else if (deleteType === 'equipment') {
        await deleteEquipment(itemToDelete.id);
        success(`Equipamento removido.`);
        setDeleteModalOpen(false);
        loadClientData();
      } else if (deleteType === 'order') {
        await deleteServiceOrder(itemToDelete.id);
        success(`Ordem de Serviço removida.`);
        setDeleteModalOpen(false);
        loadClientData();
      }
    } catch (err: any) {
      error(err.message || 'Erro ao excluir item.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !client) {
    return <LoadingSpinner message="Carregando dados do cliente..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/clients')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Clientes
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingEquip(null);
              setEquipModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-termoluc-400 text-slate-700 hover:text-termoluc-700 text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-termoluc-600" />
            Adicionar Equipamento
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingOS(null);
              setOsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-termoluc-600 hover:bg-termoluc-700 text-white text-xs font-bold shadow-sm shadow-termoluc-200 transition-all active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            Nova Ordem de Serviço
          </button>
        </div>
      </div>

      {/* Client Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Client Image */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center text-termoluc-700 shadow-sm">
            {client.image_url ? (
              <img src={client.image_url} alt={client.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-12 h-12 text-slate-400" />
            )}
          </div>

          {/* Client Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {client.name}
                  </h1>
                  {client.created_by && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-termoluc-50 text-termoluc-700 text-[10px] font-bold border border-termoluc-200">
                      <UserCheck className="w-3 h-3 text-termoluc-600" />
                      Cadastrado por: {client.created_by}
                    </span>
                  )}
                </div>
                {client.document && (
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    CPF / CNPJ: <strong className="text-slate-600">{client.document}</strong>
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setClientModalOpen(true)}
                  className="p-2 text-slate-500 hover:text-termoluc-700 hover:bg-termoluc-50 rounded-xl transition-colors"
                  title="Editar cliente"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteType('client');
                    setItemToDelete({ id: client.id, name: client.name });
                    setDeleteModalOpen(true);
                  }}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Excluir cliente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Telefone / WhatsApp</span>
                  <span className="font-semibold text-slate-800">{client.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">E-mail</span>
                  <span className="font-semibold text-slate-800 truncate block">{client.email || 'Não informado'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-slate-700 sm:col-span-2 lg:col-span-1">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-500 flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Endereço Principal</span>
                  <span className="font-medium text-slate-800 leading-tight block">{client.address}</span>
                </div>
              </div>
            </div>

            {/* Endereços Adicionais 2 e 3 */}
            {(client.address_2 || client.address_3) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
                {client.address_2 && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-termoluc-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Endereço 2 (Filial / Unidade)</span>
                      <span className="font-medium text-slate-800">{client.address_2}</span>
                    </div>
                  </div>
                )}
                {client.address_3 && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-termoluc-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Endereço 3 (Depósito / Outro Local)</span>
                      <span className="font-medium text-slate-800">{client.address_3}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {client.notes && (
              <div className="mt-4 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">Observações & Instruções de Acesso:</span>
                  <p className="leading-relaxed">{client.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Equipamentos & Histórico */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('equipments')}
            className={`pb-2 px-1 text-sm font-bold transition-all relative ${
              activeTab === 'equipments'
                ? 'text-termoluc-600 border-b-2 border-termoluc-600 -mb-2.5'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Equipamentos Vinculados ({equipment.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-1 text-sm font-bold transition-all relative ${
              activeTab === 'history'
                ? 'text-termoluc-600 border-b-2 border-termoluc-600 -mb-2.5'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Histórico de Ordens de Serviço ({orders.length})
            </span>
          </button>
        </div>

        {/* Tab 1: Equipamentos */}
        {activeTab === 'equipments' && (
          <div className="space-y-4">
            {equipment.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipment.map((equip) => (
                  <div
                    key={equip.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-termoluc-300 transition-all group"
                  >
                    <div>
                      {/* Photo or gallery */}
                      {(() => {
                        const photos = equip.images && equip.images.length > 0
                          ? equip.images
                          : equip.image_url ? [equip.image_url] : [];
                        const mainPhoto = photos[0];
                        if (!mainPhoto) return null;

                        return (
                          <div className="mb-3.5 space-y-1.5">
                            <div
                              onClick={() => {
                                setGalleryPhotos(photos);
                                setActivePhotoIdx(0);
                              }}
                              className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 relative cursor-pointer group/img"
                            >
                              <img
                                src={mainPhoto}
                                alt={equip.model}
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                              />
                              {photos.length > 1 && (
                                <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md">
                                  <Camera className="w-3 h-3" />
                                  <span>{photos.length} fotos</span>
                                </div>
                              )}
                            </div>

                            {photos.length > 1 && (
                              <div className="flex gap-1.5 overflow-x-auto pb-1">
                                {photos.map((p, pIdx) => (
                                  <div
                                    key={pIdx}
                                    onClick={() => {
                                      setGalleryPhotos(photos);
                                      setActivePhotoIdx(pIdx);
                                    }}
                                    className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 cursor-pointer hover:border-termoluc-500 transition-colors"
                                  >
                                    <img src={p} alt={`Thumb ${pIdx + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-bold text-termoluc-600 uppercase tracking-wider block">
                            {equip.brand}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900">
                            {equip.type}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Modelo: <strong>{equip.model}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        {equip.address && (
                          <p className="flex items-start gap-1.5 text-slate-800">
                            <MapPin className="w-3.5 h-3.5 text-termoluc-600 flex-shrink-0 mt-0.5" />
                            <span className="font-semibold leading-tight">{equip.address}</span>
                          </p>
                        )}
                        {equip.installation_location && (
                          <p className="flex items-center gap-1.5 text-slate-700">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Cômodo:</span>
                            <span className="font-medium text-slate-800">{equip.installation_location}</span>
                          </p>
                        )}
                        {equip.serial_number && (
                          <p className="flex items-center gap-1.5">
                            <Tag className="w-3 h-3 text-slate-400" />
                            Série: <span className="font-semibold text-slate-800">{equip.serial_number}</span>
                          </p>
                        )}
                        {equip.capacity && (
                          <p className="flex items-center gap-1.5">
                            <Wrench className="w-3 h-3 text-slate-400" />
                            Capacidade: <span className="font-semibold text-slate-800">{equip.capacity}</span>
                          </p>
                        )}
                        {equip.installation_date && (
                          <p className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                            <Calendar className="w-3 h-3" />
                            Instalação: {new Date(equip.installation_date).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                        {equip.created_by && (
                          <p className="flex items-center gap-1.5 text-[11px] text-termoluc-700 font-medium pt-0.5">
                            <UserCheck className="w-3 h-3 text-termoluc-600" />
                            Cadastrado por: {equip.created_by}
                          </p>
                        )}
                      </div>

                      {equip.notes && (
                        <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                          {equip.notes}
                        </p>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOS(null);
                          setOsModalOpen(true);
                        }}
                        className="text-xs font-bold text-termoluc-600 hover:text-termoluc-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Criar OS
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEquip(equip);
                            setEquipModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-termoluc-600 rounded-lg hover:bg-termoluc-50 transition-colors"
                          title="Editar maquinário"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteType('equipment');
                            setItemToDelete({ id: equip.id, name: `${equip.brand} - ${equip.model}` });
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Excluir maquinário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Wrench}
                title="Nenhum equipamento cadastrado"
                description="Cadastre os equipamentos deste cliente para manter histórico técnico e manutenções."
                actionText="Cadastrar Equipamento"
                onAction={() => {
                  setEditingEquip(null);
                  setEquipModalOpen(true);
                }}
              />
            )}
          </div>
        )}

        {/* Tab 2: Histórico de OS */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-termoluc-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-termoluc-50 text-termoluc-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">{order.order_number}</span>
                            <StatusBadge status={order.status} size="sm" />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {new Date(order.service_date).toLocaleDateString('pt-BR')}
                            </span>
                            <span>•</span>
                            <span>Técnico: <strong className="text-slate-800">{order.technician?.name || 'Não informado'}</strong></span>
                            {order.equipment && (
                              <>
                                <span>•</span>
                                <span>Equipamento: <strong className="text-termoluc-700">{order.equipment.type} ({order.equipment.brand})</strong></span>
                              </>
                            )}
                            {order.created_by && (
                              <>
                                <span>•</span>
                                <span className="text-termoluc-600 font-medium">ADM: <strong>{order.created_by}</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-start">
                        <button
                          type="button"
                          onClick={() => setSelectedOSForDetails(order)}
                          className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-termoluc-50 text-slate-700 hover:text-termoluc-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver Detalhes
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 whitespace-pre-wrap">
                      {order.description}
                    </p>

                    {/* Mini Galeria de Fotos */}
                    {order.images && order.images.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" />
                          {order.images.length} foto(s):
                        </span>
                        {order.images.map((img: ServiceOrderImage, i: number) => (
                          <div
                            key={i}
                            onClick={() => setSelectedOSForDetails(order)}
                            className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <img src={img.image_url} alt="Foto OS" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="Nenhuma Ordem de Serviço cadastrada"
                description="Registre a primeira manutenção ou atendimento técnico para este cliente."
                actionText="Nova Ordem de Serviço"
                onAction={() => {
                  setEditingOS(null);
                  setOsModalOpen(true);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Modais */}
      <ClientFormModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        client={client}
        onSuccess={() => loadClientData()}
      />

      <EquipmentFormModal
        isOpen={equipModalOpen}
        onClose={() => setEquipModalOpen(false)}
        equipment={editingEquip}
        defaultClientId={client.id}
        onSuccess={() => loadClientData()}
      />

      <ServiceOrderFormModal
        isOpen={osModalOpen}
        onClose={() => setOsModalOpen(false)}
        order={editingOS}
        defaultClientId={client.id}
        onSuccess={() => loadClientData()}
      />

      <ServiceOrderDetailsModal
        isOpen={Boolean(selectedOSForDetails)}
        onClose={() => setSelectedOSForDetails(null)}
        order={selectedOSForDetails}
        onEdit={(ord: ServiceOrder) => {
          setSelectedOSForDetails(null);
          setEditingOS(ord);
          setOsModalOpen(true);
        }}
        onDelete={(ord: ServiceOrder) => {
          setSelectedOSForDetails(null);
          setDeleteType('order');
          setItemToDelete({ id: ord.id, name: ord.order_number });
          setDeleteModalOpen(true);
        }}
        onStatusChange={() => loadClientData()}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={
          deleteType === 'client'
            ? 'Excluir Cliente'
            : deleteType === 'equipment'
            ? 'Excluir Equipamento'
            : 'Excluir Ordem de Serviço'
        }
        message={
          deleteType === 'client'
            ? 'Tem certeza que deseja excluir este cliente? Todos os equipamentos e histórico serão excluídos.'
            : 'Tem certeza que deseja remover este item da base de dados compartilhada?'
        }
        itemName={itemToDelete?.name}
        loading={deleting}
      />

      {/* Photo Gallery Modal */}
      {activePhotoIdx !== null && galleryPhotos[activePhotoIdx] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActivePhotoIdx(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between text-white mb-2 px-2">
              <span className="text-xs font-semibold">
                Foto {activePhotoIdx + 1} de {galleryPhotos.length}
              </span>
              <button
                onClick={() => setActivePhotoIdx(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              {galleryPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActivePhotoIdx((activePhotoIdx - 1 + galleryPhotos.length) % galleryPhotos.length)}
                  className="absolute left-2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-xl z-10"
                  title="Foto anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <img
                src={galleryPhotos[activePhotoIdx]}
                alt={`Foto ${activePhotoIdx + 1}`}
                className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-2xl"
              />

              {galleryPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActivePhotoIdx((activePhotoIdx + 1) % galleryPhotos.length)}
                  className="absolute right-2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-xl z-10"
                  title="Próxima foto"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
