import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="text-center sm:text-left">
        <div className="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-xl mb-4 border border-red-100">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium">Esta ação é irreversível.</p>
        </div>

        <p className="text-slate-600 text-sm mb-2">{message}</p>
        {itemName && (
          <p className="font-semibold text-slate-800 bg-slate-100 p-2.5 rounded-lg text-sm mb-6 border border-slate-200">
            {itemName}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-200 flex items-center justify-center gap-2"
          >
            {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
