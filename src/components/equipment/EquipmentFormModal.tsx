import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { MultiImageUpload } from '../ui/ImageUpload';
import { SearchableClientSelect } from '../ui/SearchableClientSelect';
import { Equipment, Client } from '../../types';
import { createEquipment, updateEquipment, getClients } from '../../services/db';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment?: Equipment | null;
  defaultClientId?: string;
  onSuccess: (equip: Equipment) => void;
}

const COMMON_EQUIPMENT_TYPES = [
  'Ar-condicionado Split Hi-Wall',
  'Ar-condicionado Split Cassete',
  'Ar-condicionado Piso Teto',
  'Ar-condicionado Multi-Split',
  'Sistema VRF / VRV',
  'Câmara Frigorífica de Resfriados',
  'Câmara Frigorífica de Congelados',
  'Chiller de Condensação a Ar',
  'Chiller de Condensação a Água',
  'Balcão Frigorífico / Expositor',
  'Freezer Comercial',
  'Máquina de Gelo Industrial',
  'Outro Equipamento',
];

export const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  isOpen,
  onClose,
  equipment,
  defaultClientId,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const isEditing = Boolean(equipment);

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    type: 'Ar-condicionado Split Hi-Wall',
    brand: '',
    model: '',
    serial_number: '',
    capacity: '',
    installation_location: '',
    installation_date: '',
    notes: '',
    created_by: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadClients() {
      const data = await getClients();
      setClients(data);
    }
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  useEffect(() => {
    if (equipment) {
      const ids = equipment.client_ids && equipment.client_ids.length > 0
        ? equipment.client_ids
        : equipment.client_id ? [equipment.client_id] : (defaultClientId ? [defaultClientId] : []);
      setSelectedClientIds(ids);

      const existingImages = equipment.images && equipment.images.length > 0
        ? equipment.images
        : equipment.image_url ? [equipment.image_url] : [];
      setImages(existingImages);

      setFormData({
        type: equipment.type || 'Ar-condicionado Split Hi-Wall',
        brand: equipment.brand || '',
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        capacity: equipment.capacity || '',
        installation_location: equipment.installation_location || '',
        installation_date: equipment.installation_date || '',
        notes: equipment.notes || '',
        created_by: equipment.created_by || user?.name || 'Alesandro',
      });
    } else {
      setSelectedClientIds(defaultClientId ? [defaultClientId] : (clients[0] ? [clients[0].id] : []));
      setImages([]);
      setFormData({
        type: 'Ar-condicionado Split Hi-Wall',
        brand: '',
        model: '',
        serial_number: '',
        capacity: '',
        installation_location: '',
        installation_date: new Date().toISOString().split('T')[0],
        notes: '',
        created_by: user?.name || 'Alesandro',
      });
    }
  }, [equipment, defaultClientId, isOpen, clients, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClientIds.length === 0) {
      error('O equipamento deve obrigatoriamente estar vinculado a pelo menos um cliente proprietário.');
      return;
    }
    if (!formData.brand.trim()) {
      error('Informe a marca do equipamento.');
      return;
    }
    if (!formData.model.trim()) {
      error('Informe o modelo do equipamento.');
      return;
    }

    try {
      setLoading(true);
      let saved: Equipment;

      const payload = {
        ...formData,
        client_id: selectedClientIds[0],
        client_ids: selectedClientIds,
        image_url: images[0] || '',
        images: images,
        created_by: formData.created_by || user?.name || 'Alesandro',
      };

      if (isEditing && equipment) {
        saved = await updateEquipment(equipment.id, payload);
        success(`Equipamento "${saved.brand} - ${saved.model}" atualizado com sucesso!`);
      } else {
        saved = await createEquipment(payload);
        success(`Equipamento "${saved.brand} - ${saved.model}" cadastrado por ${payload.created_by}!`);
      }

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      error(err.message || 'Erro ao salvar equipamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Equipamento' : 'Cadastrar Equipamento'}
      subtitle={`Vincule o maquinário a um ou mais clientes/proprietários (Responsável: ${user?.name || 'Alesandro'})`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cliente Proprietário com Suporte a Múltiplos Clientes (Casais/Sócios) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Cliente(s) Proprietário(s) <span className="text-red-500">*</span></span>
              <span className="text-[11px] text-slate-400 font-normal normal-case">
                Selecione um ou mais clientes (ex: Casais, Sócios)
              </span>
            </label>
            <SearchableClientSelect
              clients={clients}
              isMulti={true}
              selectedClientIds={selectedClientIds}
              onSelectClientIds={(ids) => setSelectedClientIds(ids)}
              labelPlaceholder="Buscar e vincular cliente(s) proprietário(s)..."
              required
            />
          </div>

          {/* Tipo do equipamento */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tipo de Equipamento <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            >
              {COMMON_EQUIPMENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Marca */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Marca <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Daikin, Carrier, Elgin, LG, Bitzer"
              value={formData.brand}
              onChange={e => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Modelo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: FCQ36PVM ou 30RB"
              value={formData.model}
              onChange={e => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          {/* Número de Série */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Número de Série / Tag
            </label>
            <input
              type="text"
              placeholder="Ex: SN-98127391-BR"
              value={formData.serial_number}
              onChange={e => setFormData({ ...formData, serial_number: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          {/* Capacidade */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Capacidade / Potência
            </label>
            <input
              type="text"
              placeholder="Ex: 36.000 BTU, 5 HP, 20 TR, 15m³"
              value={formData.capacity}
              onChange={e => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          {/* Local de Instalação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Local de Instalação
            </label>
            <input
              type="text"
              placeholder="Ex: Cozinha Industrial, Salão Principal, Telhado"
              value={formData.installation_location}
              onChange={e => setFormData({ ...formData, installation_location: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          {/* Data de Instalação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Data de Instalação
            </label>
            <input
              type="date"
              value={formData.installation_date}
              onChange={e => setFormData({ ...formData, installation_date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          {/* Observações Técnicas */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observações Técnicas / Gás Refrigerante / Tensão
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Fluído R-410A, Trifásico 220V, painel com disjuntor exclusivo..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm resize-none"
            />
          </div>

          {/* Fotos do Equipamento (Sem limites e com arrastar para reordenar) */}
          <div className="sm:col-span-2">
            <MultiImageUpload
              label="Fotos do Equipamento / Plaqueta Técnica / Local"
              helperText="Adicione quantas fotos desejar. Arraste os cards para reorganizar a ordem de exibição."
              images={images}
              onChange={setImages}
              folder="equipment"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            Cadastrado por: <strong className="text-slate-700">{user?.name || 'Alesandro'}</strong>
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-termoluc-600 hover:bg-termoluc-700 rounded-xl transition-all shadow-sm shadow-termoluc-200 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
