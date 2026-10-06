import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Technician } from '../../types';
import { createTechnician, updateTechnician } from '../../services/db';
import { useToast } from '../../context/ToastContext';

interface TechnicianFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  technician?: Technician | null;
  onSuccess: (tech: Technician) => void;
}

export const TechnicianFormModal: React.FC<TechnicianFormModalProps> = ({
  isOpen,
  onClose,
  technician,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const isEditing = Boolean(technician);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    specialty: '',
    active: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (technician) {
      setFormData({
        name: technician.name || '',
        phone: technician.phone || '',
        email: technician.email || '',
        specialty: technician.specialty || '',
        active: technician.active ?? true,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        specialty: '',
        active: true,
      });
    }
  }, [technician, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('O nome do técnico é obrigatório.');
      return;
    }

    try {
      setLoading(true);
      let saved: Technician;

      if (isEditing && technician) {
        saved = await updateTechnician(technician.id, formData);
        success(`Técnico "${saved.name}" atualizado com sucesso!`);
      } else {
        saved = await createTechnician(formData);
        success(`Técnico "${saved.name}" cadastrado com sucesso!`);
      }

      onSuccess(saved);
      onClose();
    } catch (err: any) {
      error(err.message || 'Erro ao salvar técnico.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Técnico' : 'Novo Técnico'}
      subtitle="Cadastre técnicos responsáveis pela execução das Ordens de Serviço"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Nome Completo do Técnico <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Carlos Eduardo de Souza"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Telefone / WhatsApp
          </label>
          <input
            type="text"
            placeholder="(11) 99999-9999"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            E-mail
          </label>
          <input
            type="email"
            placeholder="tecnico@termoluc.com.br"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Especialidade / Foco Técnico
          </label>
          <input
            type="text"
            placeholder="Ex: Câmaras Frigoríficas, VRF, PMOC, Elétrica"
            value={formData.specialty}
            onChange={e => setFormData({ ...formData, specialty: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
          />
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={e => setFormData({ ...formData, active: e.target.checked })}
            className="w-4 h-4 text-termoluc-600 rounded border-slate-300 focus:ring-termoluc-500"
          />
          <label htmlFor="active" className="text-xs font-medium text-slate-700 cursor-pointer">
            Técnico Ativo (Disponível para seleção em novas Ordens de Serviço)
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
            {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Técnico'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
