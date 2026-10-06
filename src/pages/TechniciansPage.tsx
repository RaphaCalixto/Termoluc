import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  Phone,
  Mail,
  Wrench,
  Edit2,
  Trash2,
  Power
} from 'lucide-react';
import { Technician } from '../types';
import { getTechnicians, deleteTechnician, updateTechnician } from '../services/db';
import { TechnicianFormModal } from '../components/technicians/TechnicianFormModal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';

export const TechniciansPage: React.FC = () => {
  const { success, error } = useToast();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [techToDelete, setTechToDelete] = useState<Technician | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getTechnicians();
      setTechnicians(data);
    } catch (err) {
      console.error('Erro ao carregar técnicos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (tech: Technician) => {
    try {
      const updated = await updateTechnician(tech.id, { active: !tech.active });
      success(`Técnico ${tech.name} foi ${updated.active ? 'ativado' : 'desativado'}.`);
      await loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao alterar status do técnico.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!techToDelete) return;
    try {
      setDeleting(true);
      await deleteTechnician(techToDelete.id);
      success(`Técnico "${techToDelete.name}" removido com sucesso.`);
      setDeleteModalOpen(false);
      setTechToDelete(null);
      await loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao excluir técnico.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Técnicos Responsáveis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Equipe técnica autorizada para atendimento e emissão de Ordens de Serviço
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTech(null);
            setFormModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-termoluc-600 hover:bg-termoluc-700 text-white text-xs font-bold shadow-sm shadow-termoluc-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Técnico
        </button>
      </div>

      {/* Technicians Grid */}
      {loading ? (
        <LoadingSpinner message="Carregando equipe técnica..." />
      ) : technicians.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((tech) => (
            <div
              key={tech.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                tech.active
                  ? 'border-slate-200/80 hover:border-termoluc-300'
                  : 'border-slate-200/60 bg-slate-50/50 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-termoluc-50 text-termoluc-700 font-extrabold text-sm flex items-center justify-center border border-termoluc-100">
                      {tech.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{tech.name}</h3>
                      <StatusBadge status={tech.active ? 'Ativo' : 'Inativo'} size="sm" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(tech)}
                    className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      tech.active
                        ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                        : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                    title={tech.active ? 'Desativar técnico' : 'Ativar técnico'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  {tech.specialty && (
                    <div className="flex items-center gap-2 text-termoluc-700 font-semibold">
                      <Wrench className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{tech.specialty}</span>
                    </div>
                  )}
                  {tech.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{tech.phone}</span>
                    </div>
                  )}
                  {tech.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{tech.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Cadastrado em {new Date(tech.created_at).toLocaleDateString('pt-BR')}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTech(tech);
                      setFormModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-termoluc-600 hover:bg-termoluc-50 rounded-lg transition-colors"
                    title="Editar técnico"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTechToDelete(tech);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir técnico"
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
          icon={UserCog}
          title="Nenhum técnico cadastrado"
          description="Cadastre os técnicos que realizam as manutenções e atendimentos."
          actionText="Cadastrar Técnico"
          onAction={() => {
            setEditingTech(null);
            setFormModalOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <TechnicianFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        technician={editingTech}
        onSuccess={() => loadData()}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Técnico"
        message="Tem certeza que deseja excluir este técnico? Ordens de serviço anteriores continuarão registradas."
        itemName={techToDelete?.name}
        loading={deleting}
      />
    </div>
  );
};
