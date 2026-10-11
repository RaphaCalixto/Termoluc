import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { SearchableClientSelect } from '../ui/SearchableClientSelect';
import { Schedule, Client, Equipment, Technician, ScheduleStatus } from '../../types';
import {
  createSchedule,
  updateSchedule,
  getClients,
  getEquipmentByClientId,
  getTechnicians,
} from '../../services/db';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, MapPin, DollarSign } from 'lucide-react';

interface ScheduleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: Schedule | null;
  defaultDate?: string;
  onSuccess: (schedule: Schedule) => void;
}

const SERVICE_TYPE_OPTIONS = [
  'Instalação de Ar-condicionado',
  'Manutenção Preventiva',
  'Manutenção Corretiva / Reparo',
  'Higienização e Limpeza Completa',
  'Carga de Gás Refrigerante',
  'Visita Técnica e Orçamento',
  'Desinstalação / Remanejamento',
  'Manutenção em Câmara Frigorífica',
  'Outro Serviço Especializado',
];

const STATUS_OPTIONS: { value: ScheduleStatus; label: string; color: string }[] = [
  { value: 'Agendado', label: 'Agendado', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Confirmado', label: 'Confirmado', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'Em andamento', label: 'Em andamento', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'Concluído', label: 'Concluído', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'Cancelado', label: 'Cancelado', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const ScheduleFormModal: React.FC<ScheduleFormModalProps> = ({
  isOpen,
  onClose,
  schedule,
  defaultDate,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const isEditing = Boolean(schedule);

  const [clients, setClients] = useState<Client[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);

  // Form states
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [equipmentName, setEquipmentName] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [serviceDate, setServiceDate] = useState(
    defaultDate || new Date().toISOString().split('T')[0]
  );
  const [serviceTime, setServiceTime] = useState('09:00');
  const [serviceType, setServiceType] = useState('Higienização e Limpeza Completa');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<ScheduleStatus>('Agendado');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Load clients and techs
  useEffect(() => {
    async function loadInitial() {
      const [cData, tData] = await Promise.all([getClients(), getTechnicians()]);
      setClients(cData);
      setTechnicians(tData);
    }
    if (isOpen) {
      loadInitial();
    }
  }, [isOpen]);

  // Sync state with selected schedule or default values
  useEffect(() => {
    if (schedule) {
      setClientId(schedule.client_id || '');
      setClientName(schedule.client_name || '');
      setClientPhone(schedule.client_phone || '');
      setEquipmentId(schedule.equipment_id || '');
      setEquipmentName(schedule.equipment_name || '');
      setTechnicianId(schedule.technician_id || '');
      setServiceDate(schedule.service_date || new Date().toISOString().split('T')[0]);
      setServiceTime(schedule.service_time || '09:00');
      setServiceType(schedule.service_type || 'Higienização e Limpeza Completa');
      setAddress(schedule.address || '');
      setStatus(schedule.status || 'Agendado');
      setValue(schedule.value ? schedule.value.toString() : '');
      setDescription(schedule.description || '');
      setNotes(schedule.notes || '');
    } else {
      setClientId('');
      setClientName('');
      setClientPhone('');
      setEquipmentId('');
      setEquipmentName('');
      setTechnicianId(technicians[0]?.id || '');
      setServiceDate(defaultDate || new Date().toISOString().split('T')[0]);
      setServiceTime('09:00');
      setServiceType('Higienização e Limpeza Completa');
      setAddress('');
      setStatus('Agendado');
      setValue('');
      setDescription('');
      setNotes('');
    }
  }, [schedule, defaultDate, isOpen, technicians]);

  // When client changes, load equipment and autofill phone/address
  useEffect(() => {
    if (clientId) {
      const selected = clients.find(c => c.id === clientId);
      if (selected) {
        setClientName(selected.name);
        setClientPhone(selected.phone || '');
        if (!address || !schedule) {
          setAddress(selected.address || '');
        }
      }
      getEquipmentByClientId(clientId).then(eqs => {
        setEquipmentList(eqs);
      });
    } else {
      setEquipmentList([]);
    }
  }, [clientId, clients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim() && !clientId) {
      error('Por favor, informe ou selecione o cliente para o agendamento.');
      return;
    }

    if (!serviceDate) {
      error('Informe a data do serviço.');
      return;
    }

    if (!serviceTime) {
      error('Informe o horário previsto.');
      return;
    }

    try {
      setLoading(true);

      const targetTech = technicians.find(t => t.id === technicianId);
      const targetEquip = equipmentList.find(e => e.id === equipmentId);

      const payload = {
        client_id: clientId || undefined,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || undefined,
        equipment_id: equipmentId || null,
        equipment_name: targetEquip ? `${targetEquip.brand} - ${targetEquip.model}` : equipmentName.trim() || undefined,
        technician_id: technicianId || undefined,
        technician_name: targetTech?.name || undefined,
        service_date: serviceDate,
        service_time: serviceTime,
        service_type: serviceType,
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        status,
        value: value ? parseFloat(value.replace(',', '.')) : undefined,
        notes: notes.trim() || undefined,
        created_by: user?.name || 'Alesandro',
      };

      let result: Schedule;
      if (isEditing && schedule) {
        result = await updateSchedule(schedule.id, payload);
        success(`Serviço agendado atualizado com sucesso!`);
      } else {
        result = await createSchedule(payload);
        success(`Novo serviço agendado com sucesso no sistema!`);
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      error(err.message || 'Erro ao salvar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === clientId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Agendamento de Serviço' : 'Agendar Novo Serviço'}
      subtitle={isEditing ? 'Atualize as informações do atendimento' : 'Preencha os dados do cliente, data, horário e serviço'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cliente */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Cliente <span className="text-rose-500">*</span>
          </label>
          <SearchableClientSelect
            clients={clients}
            selectedClientId={clientId}
            onSelectClient={(id) => setClientId(id)}
            labelPlaceholder="Buscar cliente cadastrado..."
          />

          {/* Nome avulso caso não esteja cadastrado */}
          {!clientId && (
            <div className="mt-2">
              <input
                type="text"
                placeholder="Ou digite o nome do cliente diretamente..."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-xs text-slate-800"
              />
            </div>
          )}
        </div>

        {/* Telefone / WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Telefone / WhatsApp do Cliente
            </label>
            <input
              type="text"
              placeholder="(11) 98765-4321"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-xs text-slate-800"
            />
          </div>

          {/* Técnico Responsável */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Técnico Responsável
            </label>
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-xs text-slate-800 bg-white"
            >
              <option value="">Selecione o técnico responsável</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.specialty ? `• ${t.specialty}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data e Horário */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Data do Serviço <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                required
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-xs text-slate-800 bg-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Horário Previsto <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="time"
                required
                value={serviceTime}
                onChange={(e) => setServiceTime(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-xs text-slate-800 bg-white font-medium"
              />
            </div>
          </div>
        </div>

        {/* Tipo de Serviço & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo de Serviço <span className="text-rose-500">*</span>
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-xs text-slate-800 bg-white font-medium"
            >
              {SERVICE_TYPE_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Status do Agendamento
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ScheduleStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-xs text-slate-800 bg-white font-semibold"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Equipamento (se cliente tiver) */}
        {equipmentList.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Equipamento Vinculado (Opcional)
            </label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-xs text-slate-800 bg-white"
            >
              <option value="">Selecione o equipamento (ou deixe em branco)</option>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.brand} - {eq.model} {eq.installation_location ? `(${eq.installation_location})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Endereço do Atendimento */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Endereço do Atendimento
            </label>
            {selectedClient && (selectedClient.address_2 || selectedClient.address_3) && (
              <div className="flex items-center gap-1.5 text-[11px] text-termoluc-700">
                <span className="font-medium">Selecionar:</span>
                <button
                  type="button"
                  onClick={() => setAddress(selectedClient.address)}
                  className="px-1.5 py-0.5 rounded bg-termoluc-50 hover:bg-termoluc-100 text-[10px] font-bold"
                >
                  End. 1
                </button>
                {selectedClient.address_2 && (
                  <button
                    type="button"
                    onClick={() => setAddress(selectedClient.address_2!)}
                    className="px-1.5 py-0.5 rounded bg-termoluc-50 hover:bg-termoluc-100 text-[10px] font-bold"
                  >
                    End. 2
                  </button>
                )}
                {selectedClient.address_3 && (
                  <button
                    type="button"
                    onClick={() => setAddress(selectedClient.address_3!)}
                    className="px-1.5 py-0.5 rounded bg-termoluc-50 hover:bg-termoluc-100 text-[10px] font-bold"
                  >
                    End. 3
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Rua, número, complemento, bairro..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-xs text-slate-800"
            />
          </div>
        </div>

        {/* Valor Estimado & Descrição */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Valor Previsto (R$)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="0,00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-xs text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Detalhes / Descrição do Serviço
            </label>
            <input
              type="text"
              placeholder="Ex: Verificar vazamento no split da sala e repor gás..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-xs text-slate-800"
            />
          </div>
        </div>

        {/* Observações Internas */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Observações Adicionais (Anotações internas)
          </label>
          <textarea
            rows={2}
            placeholder="Ex: Chamar no interfone antes de subir, portão automático..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-xs text-slate-800 resize-none"
          />
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-termoluc-600 hover:bg-termoluc-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-termoluc-600/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar Agendamento' : 'Confirmar Agendamento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
