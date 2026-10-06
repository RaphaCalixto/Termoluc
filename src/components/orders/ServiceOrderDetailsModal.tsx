import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/Badge';
import { ServiceOrderPrintView } from './ServiceOrderPrintView';
import { ServiceOrder, OSStatus } from '../../types';
import {
  Calendar,
  User,
  Wrench,
  Building,
  Printer,
  Edit2,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  FileText
} from 'lucide-react';
import { updateServiceOrder } from '../../services/db';
import { useToast } from '../../context/ToastContext';

interface ServiceOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  onEdit: (order: ServiceOrder) => void;
  onDelete: (order: ServiceOrder) => void;
  onStatusChange?: (order: ServiceOrder) => void;
}

export const ServiceOrderDetailsModal: React.FC<ServiceOrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const { success, error } = useToast();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!order) return null;

  const handleStatusUpdate = async (newStatus: OSStatus) => {
    try {
      const updated = await updateServiceOrder(order.id, { status: newStatus });
      success(`Status da ${order.order_number} alterado para "${newStatus}"!`);
      if (onStatusChange) onStatusChange(updated);
    } catch (err: any) {
      error(err.message || 'Erro ao alterar status');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showPrintModal}
        onClose={onClose}
        title={`Ordem de Serviço ${order.order_number}`}
        subtitle={`Cadastrada em ${new Date(order.created_at).toLocaleDateString('pt-BR')}`}
        maxWidth="3xl"
      >
        <div className="space-y-6">
          {/* Top Bar: Status and Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Status Atual:</span>
              <StatusBadge status={order.status} />
              
              <select
                value={order.status}
                onChange={(e) => handleStatusUpdate(e.target.value as OSStatus)}
                className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 outline-none hover:border-termoluc-500 cursor-pointer ml-2"
              >
                <option value="Pendente">Marcar como Pendente</option>
                <option value="Em andamento">Marcar como Em andamento</option>
                <option value="Concluída">Marcar como Concluída</option>
                <option value="Cancelada">Marcar como Cancelada</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir / PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(order);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-termoluc-700 bg-termoluc-50 border border-termoluc-200 rounded-xl hover:bg-termoluc-100 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(order);
                }}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Excluir OS"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cliente(s) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-termoluc-600 font-bold text-xs uppercase tracking-wider">
                <Building className="w-4 h-4" />
                {order.clients && order.clients.length > 1 ? `Clientes Vinculados (${order.clients.length})` : 'Cliente'}
              </div>
              {order.clients && order.clients.length > 0 ? (
                <div className="space-y-2.5">
                  {order.clients.map((c, i) => (
                    <div key={c.id || i} className={i > 0 ? 'pt-2 border-t border-slate-100' : ''}>
                      <p className="text-sm font-bold text-slate-900">
                        {c.name} {order.clients && order.clients.length > 1 ? `(Cliente ${i + 1})` : ''}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">{c.address}</p>
                      <div className="text-xs text-slate-600 pt-0.5 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Tel: <strong>{c.phone}</strong></span>
                        {c.document && <span>Doc: <strong>{c.document}</strong></span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-900">{order.client?.name || 'Cliente'}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{order.client?.address}</p>
                  <div className="text-xs text-slate-600 pt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Tel: <strong>{order.client?.phone}</strong></span>
                    {order.client?.email && <span>Email: <strong>{order.client.email}</strong></span>}
                  </div>
                </>
              )}
            </div>

            {/* Equipamento e Técnico */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-termoluc-600 font-bold text-xs uppercase tracking-wider">
                <Wrench className="w-4 h-4" />
                Equipamento & Técnico
              </div>
              {order.equipment ? (
                <div>
                  <p className="text-sm font-bold text-slate-900">{order.equipment.type}</p>
                  <p className="text-xs text-slate-600">{order.equipment.brand} • {order.equipment.model} {order.equipment.capacity ? `(${order.equipment.capacity})` : ''}</p>
                  {order.equipment.installation_location && (
                    <p className="text-xs text-slate-400">Local: {order.equipment.installation_location}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Serviço Geral / Sem equipamento específico</p>
              )}
              
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Técnico: <strong className="text-slate-800">{order.technician?.name || 'Não informado'}</strong>
                </span>
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(order.service_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          {/* Descrição dos Serviços */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Descrição do Serviço Realizado
            </h4>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {order.description}
            </div>
          </div>

          {/* Observações Adicionais */}
          {order.notes && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Observações Adicionais
              </h4>
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/70 text-xs text-amber-900 whitespace-pre-wrap">
                {order.notes}
              </div>
            </div>
          )}

          {/* Valor */}
          {order.value !== undefined && order.value !== null && (
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                Valor Total Cobrado:
              </span>
              <span className="text-base font-bold text-emerald-900">
                {order.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          )}

          {/* Galeria de Fotos */}
          {order.images && order.images.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                Fotos Anexadas ({order.images.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {order.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(img.image_url)}
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group relative shadow-xs"
                  >
                    <img
                      src={img.image_url}
                      alt={`Foto OS ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                      Ver foto
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Impressão / Exportação */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 flex flex-col items-center">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between no-print">
              <span className="font-semibold text-sm">Visualização de Impressão ({order.order_number})</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 text-xs font-bold text-white bg-termoluc-600 hover:bg-termoluc-500 rounded-xl flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Salvar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 rounded-xl"
                >
                  Fechar
                </button>
              </div>
            </div>
            <div className="bg-white p-6">
              <ServiceOrderPrintView order={order} />
            </div>
          </div>
        </div>
      )}

      {/* Visualizador de Foto Individual Ampliada */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Foto ampliada"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
