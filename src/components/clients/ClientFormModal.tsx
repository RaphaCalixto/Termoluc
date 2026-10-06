import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { SingleImageUpload } from '../ui/ImageUpload';
import { Client } from '../../types';
import { createClient, updateClient } from '../../services/db';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Plus, Trash2 } from 'lucide-react';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
  onSuccess: (client: Client) => void;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const isEditing = Boolean(client);

  const [formData, setFormData] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    address_2: '',
    address_3: '',
    notes: '',
    image_url: '',
    created_by: '',
  });

  const [showAddress2, setShowAddress2] = useState(false);
  const [showAddress3, setShowAddress3] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        document: client.document || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        address_2: client.address_2 || '',
        address_3: client.address_3 || '',
        notes: client.notes || '',
        image_url: client.image_url || '',
        created_by: client.created_by || user?.name || 'Alesandro',
      });
      setShowAddress2(Boolean(client.address_2));
      setShowAddress3(Boolean(client.address_3));
    } else {
      setFormData({
        name: '',
        document: '',
        phone: '',
        email: '',
        address: '',
        address_2: '',
        address_3: '',
        notes: '',
        image_url: '',
        created_by: user?.name || 'Alesandro',
      });
      setShowAddress2(false);
      setShowAddress3(false);
    }
  }, [client, isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('O nome / razão social do cliente é obrigatório.');
      return;
    }
    if (!formData.phone.trim()) {
      error('O telefone de contato é obrigatório.');
      return;
    }
    if (!formData.address.trim()) {
      error('O endereço principal é obrigatório.');
      return;
    }

    try {
      setLoading(true);
      let savedClient: Client;

      const payload = {
        ...formData,
        created_by: formData.created_by || user?.name || 'Alesandro',
      };

      if (isEditing && client) {
        savedClient = await updateClient(client.id, payload);
        success(`Cliente "${savedClient.name}" atualizado com sucesso!`);
      } else {
        savedClient = await createClient(payload);
        success(`Cliente "${savedClient.name}" cadastrado por ${payload.created_by}!`);
      }

      onSuccess(savedClient);
      onClose();
    } catch (err: any) {
      error(err.message || 'Erro ao salvar cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cliente' : 'Novo Cliente'}
      subtitle={`Cadastro com rastreabilidade de Administrador (Responsável: ${user?.name || 'Alesandro'})`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nome / Razão Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Restaurante Sabor Real ou João da Silva"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              CPF / CNPJ
            </label>
            <input
              type="text"
              placeholder="00.000.000/0000-00"
              value={formData.document}
              onChange={e => setFormData({ ...formData, document: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Telefone / WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              E-mail
            </label>
            <input
              type="email"
              placeholder="contato@cliente.com.br"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          {/* Endereço 1 (Principal) */}
          <div className="sm:col-span-2 space-y-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Endereço Principal (1) <span className="text-red-500">*</span></span>
              {!showAddress2 && (
                <button
                  type="button"
                  onClick={() => setShowAddress2(true)}
                  className="text-xs font-semibold text-termoluc-600 hover:text-termoluc-700 flex items-center gap-1 normal-case"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Adicionar Endereço 2
                </button>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
              />
            </div>
          </div>

          {/* Endereço 2 (Opcional) */}
          {showAddress2 && (
            <div className="sm:col-span-2 space-y-1 p-3 bg-slate-50/80 rounded-xl border border-slate-200 animate-fadeIn">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-termoluc-600" />
                  Endereço 2 (Filial / Unidade / Outro Local)
                </label>
                <div className="flex items-center gap-2">
                  {!showAddress3 && (
                    <button
                      type="button"
                      onClick={() => setShowAddress3(true)}
                      className="text-xs font-semibold text-termoluc-600 hover:text-termoluc-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Adicionar Endereço 3
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, address_2: '' });
                      setShowAddress2(false);
                    }}
                    className="text-slate-400 hover:text-red-500 p-1"
                    title="Remover endereço 2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Endereço da filial ou segundo ponto de atendimento..."
                value={formData.address_2}
                onChange={e => setFormData({ ...formData, address_2: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
              />
            </div>
          )}

          {/* Endereço 3 (Opcional) */}
          {showAddress3 && (
            <div className="sm:col-span-2 space-y-1 p-3 bg-slate-50/80 rounded-xl border border-slate-200 animate-fadeIn">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-termoluc-600" />
                  Endereço 3 (Terceira Unidade / Depósito / Outro Local)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, address_3: '' });
                    setShowAddress3(false);
                  }}
                  className="text-slate-400 hover:text-red-500 p-1"
                  title="Remover endereço 3"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Endereço da terceira unidade ou galpão..."
                value={formData.address_3}
                onChange={e => setFormData({ ...formData, address_3: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observações / Instruções de Acesso
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Horário permitido para manutenção, contato do gerente local, ponto de referência..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm resize-none"
            />
          </div>

          <div className="sm:col-span-2">
            <SingleImageUpload
              label="Foto da Fachada / Local do Cliente (Opcional)"
              value={formData.image_url}
              onChange={url => setFormData({ ...formData, image_url: url })}
              folder="clients"
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
              {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
