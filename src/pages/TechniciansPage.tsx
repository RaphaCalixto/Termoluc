import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  Phone,
  Mail,
  Wrench,
  Edit2,
  Trash2,
  Power,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { Technician } from '../types';
import { getTechnicians, deleteTechnician, updateTechnician, updateTechnicianPassword } from '../services/db';
import { TechnicianFormModal } from '../components/technicians/TechnicianFormModal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const TechniciansPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [techToDelete, setTechToDelete] = useState<Technician | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Password Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedTechForPassword, setSelectedTechForPassword] = useState<Technician | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechForPassword) return;

    if (newPassword.trim().length < 4) {
      error('A senha deve conter pelo menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      error('As senhas digitadas não coincidem.');
      return;
    }

    try {
      setSavingPassword(true);
      await updateTechnicianPassword(
        selectedTechForPassword.id,
        newPassword.trim(),
        selectedTechForPassword.email
      );
      success(`Senha do técnico "${selectedTechForPassword.name}" atualizada com sucesso!`);
      setPasswordModalOpen(false);
      await loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao atualizar senha do técnico.');
    } finally {
      setSavingPassword(false);
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
            Equipe técnica autorizada para atendimento, login e emissão de Ordens de Serviço
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

                {/* Login de Acesso ao Sistema */}
                {tech.email && (
                  <div className="mt-3 p-2 rounded-xl bg-termoluc-50/70 border border-termoluc-100/80 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-termoluc-900 font-medium truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-termoluc-600 flex-shrink-0" />
                      <span className="text-[10px] uppercase font-bold text-termoluc-700">Login:</span>
                      <span className="truncate font-mono">{tech.email}</span>
                    </div>
                    {user?.email?.toLowerCase() === tech.email?.toLowerCase() && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex-shrink-0">
                        Você
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Cadastrado em {new Date(tech.created_at).toLocaleDateString('pt-BR')}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTechForPassword(tech);
                      setNewPassword('');
                      setConfirmPassword('');
                      setShowPassword(false);
                      setPasswordModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-termoluc-700 bg-slate-50 hover:bg-termoluc-50 border border-slate-200 hover:border-termoluc-200 rounded-lg transition-all"
                    title="Alterar senha de acesso ao sistema deste técnico"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-termoluc-600" />
                    <span>Senha</span>
                  </button>

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

      {/* Modal de Alteração de Senha do Técnico */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Alterar Senha de Acesso"
        subtitle={`Defina a nova senha para o técnico ${selectedTechForPassword?.name || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-termoluc-100 text-termoluc-800 font-extrabold flex items-center justify-center border border-termoluc-200 text-sm">
              {selectedTechForPassword?.name ? selectedTechForPassword.name.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{selectedTechForPassword?.name}</h4>
              <p className="text-[11px] text-slate-500 font-mono truncate">{selectedTechForPassword?.email || 'Sem e-mail cadastrado'}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nova Senha de Acesso <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={4}
                placeholder="Digite a nova senha (mínimo 4 caracteres)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Confirmar Nova Senha <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Digite a nova senha novamente"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          <div className="p-3 bg-blue-50 text-termoluc-800 rounded-xl text-xs flex items-start gap-2 border border-blue-100">
            <KeyRound className="w-4 h-4 text-termoluc-600 flex-shrink-0 mt-0.5" />
            <span>Esta senha será utilizada pelo técnico para fazer login no sistema unificado da Termoluc.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(false)}
              disabled={savingPassword}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-termoluc-600 hover:bg-termoluc-700 rounded-xl transition-all shadow-sm shadow-termoluc-200 active:scale-95 disabled:opacity-50"
            >
              {savingPassword ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
