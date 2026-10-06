import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Search,
  Plus,
  Building2,
  MapPin,
  Tag,
  Calendar,
  Edit2,
  Trash2,
  FileText,
  Filter,
  Camera,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Equipment, Client } from '../types';
import { getEquipment, getClients, deleteEquipment, subscribeToDataChanges } from '../services/db';
import { EquipmentFormModal } from '../components/equipment/EquipmentFormModal';
import { ServiceOrderFormModal } from '../components/orders/ServiceOrderFormModal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';

export const EquipmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState<Equipment | null>(null);
  const [osModalOpen, setOsModalOpen] = useState(false);
  const [targetEquipForOS, setTargetEquipForOS] = useState<Equipment | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [equipToDelete, setEquipToDelete] = useState<Equipment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Photo Gallery Modal State
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eData, cData] = await Promise.all([
        getEquipment(),
        getClients(),
      ]);
      setEquipment(eData);
      setClients(cData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
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

  const handleDeleteConfirm = async () => {
    if (!equipToDelete) return;
    try {
      setDeleting(true);
      await deleteEquipment(equipToDelete.id);
      success(`Equipamento "${equipToDelete.brand} - ${equipToDelete.model}" excluído com sucesso.`);
      setDeleteModalOpen(false);
      setEquipToDelete(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao excluir equipamento.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtragem
  const filteredEquipment = equipment.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.type.toLowerCase().includes(query) ||
      item.brand.toLowerCase().includes(query) ||
      item.model.toLowerCase().includes(query) ||
      (item.serial_number && item.serial_number.toLowerCase().includes(query)) ||
      (item.address && item.address.toLowerCase().includes(query)) ||
      (item.installation_location && item.installation_location.toLowerCase().includes(query)) ||
      (item.client_name && item.client_name.toLowerCase().includes(query));

    const matchesClient = !selectedClientId || item.client_id === selectedClientId || item.client_ids?.includes(selectedClientId);
    const matchesType = !selectedType || item.type === selectedType;

    return matchesSearch && matchesClient && matchesType;
  });

  // Lista única de tipos para o filtro
  const equipmentTypes = Array.from(new Set(equipment.map(e => e.type)));

  const openGallery = (photos: string[], index = 0) => {
    setGalleryPhotos(photos);
    setActivePhotoIdx(index);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Equipamentos & Maquinários
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gerencie o parque de máquinas, ar-condicionados, chillers e câmaras frigoríficas
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingEquip(null);
            setFormModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-termoluc-600 hover:bg-termoluc-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-termoluc-200 transition-all active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Equipamento
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 focus-within:border-termoluc-500 focus-within:ring-2 focus-within:ring-termoluc-200">
          <Search className="w-5 h-5 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Buscar por marca, modelo, número de série, local ou cliente..."
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

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            Filtros:
          </div>

          {/* Filtro de Cliente */}
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-termoluc-500 cursor-pointer"
          >
            <option value="">Todos os Clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Filtro de Tipo */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-termoluc-500 cursor-pointer"
          >
            <option value="">Todos os Tipos de Equipamento</option>
            {equipmentTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {(selectedClientId || selectedType) && (
            <button
              onClick={() => {
                setSelectedClientId('');
                setSelectedType('');
              }}
              className="text-xs text-termoluc-600 hover:underline font-semibold"
            >
              Resetar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid of Equipments */}
      {loading ? (
        <LoadingSpinner message="Carregando equipamentos..." />
      ) : filteredEquipment.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((item) => {
            const photos = item.images && item.images.length > 0
              ? item.images
              : item.image_url ? [item.image_url] : [];
            const mainPhoto = photos[0];

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-termoluc-300 transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5">
                  {/* Photos Section */}
                  {mainPhoto && (
                    <div className="mb-3.5 space-y-1.5">
                      <div
                        onClick={() => openGallery(photos, 0)}
                        className="w-full h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 relative cursor-pointer group/img"
                      >
                        <img
                          src={mainPhoto}
                          alt={item.model}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                        />
                        {photos.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md">
                            <Camera className="w-3 h-3" />
                            <span>{photos.length} fotos</span>
                          </div>
                        )}
                      </div>

                      {/* Mini Thumbnail Strip if multiple photos */}
                      {photos.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {photos.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => openGallery(photos, pIdx)}
                              className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 cursor-pointer hover:border-termoluc-500 transition-colors"
                            >
                              <img src={p} alt={`Thumb ${pIdx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-termoluc-600 uppercase tracking-wider block">
                        {item.brand}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">
                        {item.type}
                      </h3>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        {item.model} {item.capacity ? `• ${item.capacity}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Cliente Vinculado */}
                  <div
                    onClick={() => navigate(`/clients/${item.client_id}`)}
                    className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs text-slate-700 hover:bg-termoluc-50/70 hover:border-termoluc-200 cursor-pointer transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-termoluc-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-medium">Cliente(s):</span>
                      <span className="font-bold text-slate-900 truncate block">{item.client_name}</span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100 mt-3">
                    {item.address && (
                      <p className="flex items-start gap-1.5 text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-termoluc-600 flex-shrink-0 mt-0.5" />
                        <span className="font-semibold leading-tight">{item.address}</span>
                      </p>
                    )}
                    {item.installation_location && (
                      <p className="flex items-center gap-1.5 text-slate-700">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Cômodo:</span>
                        <span className="font-medium text-slate-850">{item.installation_location}</span>
                      </p>
                    )}
                    {item.serial_number && (
                      <p className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-slate-400" />
                        Série: <span className="font-semibold text-slate-800">{item.serial_number}</span>
                      </p>
                    )}
                    {item.installation_date && (
                      <p className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                        <Calendar className="w-3 h-3" />
                        Instalação: {new Date(item.installation_date).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    {item.created_by && (
                      <p className="flex items-center gap-1.5 text-[11px] text-termoluc-700 font-medium pt-0.5">
                        ADM: <span className="font-semibold">{item.created_by}</span>
                      </p>
                    )}
                  </div>

                  {item.notes && (
                    <p className="mt-2.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetEquipForOS(item);
                      setOsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-termoluc-600 hover:text-termoluc-700 bg-termoluc-50 hover:bg-termoluc-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Abrir OS
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEquip(item);
                        setFormModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-termoluc-600 hover:bg-white rounded-lg transition-colors"
                      title="Editar equipamento"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEquipToDelete(item);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                      title="Excluir equipamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Wrench}
          title="Nenhum equipamento encontrado"
          description={
            searchQuery || selectedClientId || selectedType
              ? 'Tente remover os filtros ou buscar por outros termos.'
              : 'Comece cadastrando os aparelhos, splits e câmaras frigoríficas dos clientes.'
          }
          actionText={!searchQuery && !selectedClientId && !selectedType ? 'Cadastrar Equipamento' : undefined}
          onAction={() => {
            setEditingEquip(null);
            setFormModalOpen(true);
          }}
        />
      )}

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

      {/* Modals */}
      <EquipmentFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        equipment={editingEquip}
        onSuccess={() => loadData()}
      />

      <ServiceOrderFormModal
        isOpen={osModalOpen}
        onClose={() => setOsModalOpen(false)}
        defaultClientId={targetEquipForOS?.client_id}
        defaultEquipmentId={targetEquipForOS?.id}
        onSuccess={() => loadData()}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Equipamento"
        message="Tem certeza que deseja excluir este equipamento da base de dados compartilhada?"
        itemName={equipToDelete ? `${equipToDelete.brand} - ${equipToDelete.model}` : undefined}
        loading={deleting}
      />
    </div>
  );
};
