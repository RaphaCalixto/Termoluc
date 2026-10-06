import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { MultiImageUpload } from '../ui/ImageUpload';
import { SearchableClientSelect } from '../ui/SearchableClientSelect';
import { ServiceOrder, Client, Equipment, Technician, OSStatus } from '../../types';
import {
  createServiceOrder,
  updateServiceOrder,
  getClients,
  getEquipmentByClientId,
  getTechnicians,
} from '../../services/db';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface ServiceOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: ServiceOrder | null;
  defaultClientId?: string;
  defaultEquipmentId?: string;
  onSuccess: (order: ServiceOrder) => void;
}

const STATUS_OPTIONS: OSStatus[] = ['Pendente', 'Em andamento', 'Concluída', 'Cancelada'];

export const ServiceOrderFormModal: React.FC<ServiceOrderFormModalProps> = ({
  isOpen,
  onClose,
  order,
  defaultClientId,
  defaultEquipmentId,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const isEditing = Boolean(order);

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const [equipmentId, setEquipmentId] = useState(defaultEquipmentId || '');
  const [technicianId, setTechnicianId] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<OSStatus>('Concluída');
  const [value, setValue] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  // Carrega clientes e técnicos
  useEffect(() => {
    async function loadData() {
      const [cData, tData] = await Promise.all([
        getClients(),
        getTechnicians(),
      ]);
      setClients(cData);
      setTechnicians(tData.filter(t => t.active || (order && order.technician_id === t.id)));
    }
    if (isOpen) {
      loadData();
    }
  }, [isOpen, order]);

  // Carrega equipamentos vinculados a QUALQUER um dos clientes selecionados
  useEffect(() => {
    async function loadClientEquips() {
      if (selectedClientIds.length > 0) {
        const equipPromises = selectedClientIds.map(cid => getEquipmentByClientId(cid));
        const results = await Promise.all(equipPromises);
        const allEquips = results.flat();
        // Remove duplicatas por ID
        const uniqueEquips = Array.from(new Map(allEquips.map(e => [e.id, e])).values());
        setEquipmentList(uniqueEquips);
      } else {
        setEquipmentList([]);
      }
    }
    if (selectedClientIds.length > 0) {
      loadClientEquips();
    } else {
      setEquipmentList([]);
    }
  }, [selectedClientIds]);

  // Inicializa form com dados de edição ou defaults
  useEffect(() => {
    if (order) {
      const ids = order.client_ids && order.client_ids.length > 0
        ? order.client_ids
        : order.client_id ? [order.client_id] : (defaultClientId ? [defaultClientId] : []);
      setSelectedClientIds(ids);

      setEquipmentId(order.equipment_id || '');
      setTechnicianId(order.technician_id || '');
      setServiceDate(order.service_date || new Date().toISOString().split('T')[0]);
      setDescription(order.description || '');
      setNotes(order.notes || '');
      setStatus(order.status || 'Concluída');
      setValue(order.value ? order.value.toString() : '');
      setImages(order.images?.map(img => img.image_url) || []);
    } else {
      setSelectedClientIds(defaultClientId ? [defaultClientId] : (clients[0] ? [clients[0].id] : []));
      setEquipmentId(defaultEquipmentId || '');
      setTechnicianId(technicians[0]?.id || '');
      setServiceDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setNotes('');
      setStatus('Concluída');
      setValue('');
      setImages([]);
    }
  }, [order, defaultClientId, defaultEquipmentId, isOpen, clients, technicians]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClientIds.length === 0) {
      error('Selecione pelo menos um cliente para a Ordem de Serviço.');
      return;
    }
    if (!technicianId) {
      error('Selecione o técnico responsável.');
      return;
    }
    if (!serviceDate) {
      error('Informe a data de execução do serviço.');
      return;
    }
    if (!description.trim()) {
      error('A descrição do serviço realizado é obrigatória.');
      return;
    }

    try {
      setLoading(true);
      const parsedValue = value ? parseFloat(value.replace(',', '.')) : undefined;
      const adminName = user?.name || 'Alesandro';
      const primaryClientId = selectedClientIds[0];

      if (isEditing && order) {
        const updated = await updateServiceOrder(
          order.id,
          {
            client_id: primaryClientId,
            client_ids: selectedClientIds,
            equipment_id: equipmentId || null,
            technician_id: technicianId,
            service_date: serviceDate,
            description,
            notes,
            status,
            value: parsedValue,
          },
          images
        );
        success(`Ordem de Serviço ${updated.order_number} atualizada com sucesso!`);
        onSuccess(updated);
      } else {
        const created = await createServiceOrder(
          {
            client_id: primaryClientId,
            client_ids: selectedClientIds,
            equipment_id: equipmentId || null,
            technician_id: technicianId,
            service_date: serviceDate,
            description,
            notes,
            status,
            value: parsedValue,
            created_by: adminName,
          },
          images
        );
        success(`Ordem de Serviço ${created.order_number} criada por ${adminName}!`);
        onSuccess(created);
      }

      onClose();
    } catch (err: any) {
      error(err.message || 'Erro ao processar Ordem de Serviço.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar Ordem de Serviço (${order?.order_number})` : 'Nova Ordem de Serviço'}
      subtitle={`Vincule um ou mais clientes e detalhes técnicos (Responsável: ${user?.name || 'Alesandro'})`}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cliente(s) com Busca e Seleção Múltipla */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Cliente(s) Vinculado(s) <span className="text-red-500">*</span></span>
              <span className="text-[11px] text-slate-400 font-normal normal-case">
                Selecione um ou mais clientes (ex: Casais, Sócios)
              </span>
            </label>
            <SearchableClientSelect
              clients={clients}
              isMulti={true}
              selectedClientIds={selectedClientIds}
              onSelectClientIds={(ids) => {
                setSelectedClientIds(ids);
                // Não reseta equipamento se ele ainda pertencer a um dos clientes selecionados
              }}
              labelPlaceholder="Buscar e vincular cliente(s)..."
              required
            />
          </div>

          {/* Equipamento Vinculado */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Equipamento Vinculado
            </label>
            <select
              value={equipmentId}
              onChange={e => setEquipmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            >
              <option value="">Nenhum (Serviço Geral / Instalação Nova)</option>
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.type} — {eq.brand} ({eq.model}) {eq.capacity ? `[${eq.capacity}]` : ''}
                </option>
              ))}
            </select>
            {selectedClientIds.length > 0 && equipmentList.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                * Nenhum equipamento cadastrado para os clientes selecionados ainda.
              </p>
            )}
          </div>

          {/* Técnico Responsável (Apenas o nome limpo) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Técnico Responsável <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={technicianId}
              onChange={e => setTechnicianId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm font-medium"
            >
              <option value="">Selecione o técnico...</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Data do Serviço */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Data em que o Serviço foi Realizado <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={serviceDate}
              onChange={e => setServiceDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status da Ordem de Serviço <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as OSStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm font-medium"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Valor (Opcional) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Valor Total do Serviço (R$) <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          {/* Descrição do Serviço Realizado */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Descrição do Serviço Realizado <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Descreva detalhadamente o diagnóstico, serviços executados, peças substituídas, testes realizados e parâmetros aferidos (temperatura, pressão, corrente elétrica)..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm resize-none"
            />
          </div>

          {/* Observações Adicionais */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observações Adicionais / Recomendações para o Cliente
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Próxima manutenção preventiva sugerida para daqui a 90 dias. Manter filtros limpos."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm resize-none"
            />
          </div>

          {/* Upload de Fotos da OS */}
          <div className="sm:col-span-2">
            <MultiImageUpload
              images={images}
              onChange={setImages}
              folder="service-orders"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            Emitido por: <strong className="text-slate-700">{user?.name || 'Alesandro'}</strong>
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
              {loading ? 'Salvando...' : isEditing ? 'Atualizar Ordem de Serviço' : 'Emitir Ordem de Serviço'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
