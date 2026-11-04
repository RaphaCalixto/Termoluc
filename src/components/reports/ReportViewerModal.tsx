import React from 'react';
import { Modal } from '../ui/Modal';
import { Report } from '../../types';
import { 
  Download, 
  ExternalLink, 
  User, 
  Building, 
  FileText,
  Trash2,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { ReportVistoriaView } from './ReportVistoriaView';
import { ReportLimpezaView } from './ReportLimpezaView';

interface ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
  onDelete?: (report: Report) => void;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({
  isOpen,
  onClose,
  report,
  onDelete,
}) => {
  if (!report) return null;

  const handleDownloadFile = () => {
    if (report.file_url && report.file_url !== '#') {
      const link = document.createElement('a');
      link.href = report.file_url;
      link.download = report.file_name || `${report.title}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Limpeza':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Manutenção':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Instalação':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Laudo':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const isOfficialVistoria = (report.report_type === 'vistoria' || Boolean(report.vistoria_data)) && report.vistoria_data;
  const isOfficialLimpeza = (report.report_type === 'limpeza' || Boolean(report.limpeza_data)) && report.limpeza_data;
  const isCustomOfficial = isOfficialVistoria || isOfficialLimpeza;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={report.title}
      subtitle={`Categoria: ${report.category} • Emitido em ${new Date(report.report_date).toLocaleDateString('pt-BR')}`}
      maxWidth={isCustomOfficial ? '5xl' : '4xl'}
    >
      <div className="space-y-4">
        {/* Top Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`px-2.5 py-1 rounded-lg font-bold border ${getCategoryBadgeClass(report.category)}`}>
              {report.category}
            </span>

            {isCustomOfficial && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold bg-purple-100 text-purple-800 border border-purple-200">
                {isOfficialVistoria ? (
                  <>
                    <FileCheck2 className="w-3.5 h-3.5 text-purple-700" />
                    <span>Modelo Oficial Laudo</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                    <span>Modelo Oficial Higienização</span>
                  </>
                )}
              </span>
            )}

            {report.client_name && (
              <span className="flex items-center gap-1 text-slate-700">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Cliente: <strong>{report.client_name}</strong>
              </span>
            )}
            {report.technician_name && (
              <span className="flex items-center gap-1 text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Técnico: <strong>{report.technician_name}</strong>
              </span>
            )}
            {report.service_order_number && (
              <span className="flex items-center gap-1 text-termoluc-700 font-semibold">
                <FileText className="w-3.5 h-3.5" />
                OS: {report.service_order_number}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isCustomOfficial && report.file_url !== '#' && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadFile}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-termoluc-600 hover:bg-termoluc-700 text-white font-bold transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo</span>
                </button>

                <a
                  href={report.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(report);
                }}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir relatório"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Observações / Descrição se houver */}
        {report.notes && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-800 block mb-0.5">Observações do Registro:</span>
            {report.notes}
          </div>
        )}

        {/* Visualização de Modelo Oficial vs Arquivo PDF */}
        {isOfficialVistoria ? (
          <div className="max-h-[72vh] overflow-y-auto p-4 bg-slate-100 rounded-2xl border border-slate-200 flex justify-center">
            <ReportVistoriaView
              data={report.vistoria_data!}
              clientName={report.client_name}
              showActions={true}
            />
          </div>
        ) : isOfficialLimpeza ? (
          <div className="max-h-[72vh] overflow-y-auto p-4 bg-slate-100 rounded-2xl border border-slate-200 flex justify-center">
            <ReportLimpezaView
              data={report.limpeza_data!}
              clientName={report.client_name}
              showActions={true}
            />
          </div>
        ) : (
          <div className="w-full h-[65vh] rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex flex-col">
            <iframe
              src={`${report.file_url}#toolbar=1`}
              title={report.title}
              className="w-full h-full border-none"
            />
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Identificador: {report.file_name}</span>
          {report.file_size && (
            <span>Tamanho: {(report.file_size / 1024 / 1024).toFixed(2)} MB</span>
          )}
        </div>
      </div>
    </Modal>
  );
};
