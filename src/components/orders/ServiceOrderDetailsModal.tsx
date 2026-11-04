import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/Badge';
import { ServiceOrderPrintView } from './ServiceOrderPrintView';
import { ServiceOrder, OSStatus, ReportCategory } from '../../types';
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
  FileText,
  Download,
  FileDown,
  FolderArchive,
  ChevronDown
} from 'lucide-react';
import { updateServiceOrder, createReport } from '../../services/db';
import { uploadPdfFile } from '../../services/storage';
import { generatePdfFromElement } from '../../utils/pdfGenerator';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface ServiceOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  onEdit: (order: ServiceOrder) => void;
  onDelete: (order: ServiceOrder) => void;
  onStatusChange?: (order: ServiceOrder) => void;
  initialShowPrint?: boolean;
}

export const ServiceOrderDetailsModal: React.FC<ServiceOrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  onEdit,
  onDelete,
  onStatusChange,
  initialShowPrint = false,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showArchiveDropdown, setShowArchiveDropdown] = useState(false);

  useEffect(() => {
    if (isOpen && initialShowPrint) {
      setShowPrintModal(true);
    } else if (!isOpen) {
      setShowPrintModal(false);
      setShowArchiveDropdown(false);
    }
  }, [isOpen, initialShowPrint]);

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

  const handleDirectDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      // Garante que o elemento está renderizado
      if (!showPrintModal) {
        setShowPrintModal(true);
        setTimeout(async () => {
          const el = document.getElementById('service-order-printable-doc');
          if (el) {
            await generatePdfFromElement(el, `Ordem_de_Servico_${order.order_number}`);
            success(`PDF da OS ${order.order_number} baixado com sucesso!`);
          }
          setDownloadingPdf(false);
        }, 500);
        return;
      }

      const el = document.getElementById('service-order-printable-doc');
      if (el) {
        await generatePdfFromElement(el, `Ordem_de_Servico_${order.order_number}`);
        success(`PDF da OS ${order.order_number} baixado com sucesso!`);
      }
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      error('Não foi possível gerar o PDF diretamente. Você pode usar o botão "Imprimir / Salvar PDF".');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleArchiveToReports = async (category: ReportCategory) => {
    try {
      setArchiving(true);
      setShowArchiveDropdown(false);

      const el = document.getElementById('service-order-printable-doc');
      if (!el) {
        error('Abra a visualização para arquivar o relatório.');
        return;
      }

      const pdfBlob = await generatePdfFromElement(el, `OS_${order.order_number}`);
      const uploaded = await uploadPdfFile(pdfBlob, `OS_${order.order_number}.pdf`, category.toLowerCase());

      const clientName = order.clients && order.clients.length > 0
        ? order.clients.map(c => c.name).join(' & ')
        : (order.client?.name || 'Cliente');

      await createReport({
        title: `Ordem de Serviço ${order.order_number} - ${clientName}`,
        category,
        client_id: order.client_id || null,
        client_name: clientName,
        equipment_id: order.equipment_id || null,
        equipment_name: order.equipment ? `${order.equipment.brand} ${order.equipment.model}` : undefined,
        service_order_id: order.id,
        service_order_number: order.order_number,
        technician_name: order.technician?.name || 'Alessandro Araújo',
        file_url: uploaded.url,
        file_name: uploaded.name,
        file_size: uploaded.size,
        report_date: order.service_date,
        notes: order.description,
        created_by: user?.name || 'Alesandro',
      });

      success(`OS ${order.order_number} arquivada com sucesso em Relatórios > ${category}!`);
    } catch (err: any) {
      console.error('Erro ao arquivar em relatórios:', err);
      error('Erro ao arquivar relatório no banco de dados.');
    } finally {
      setArchiving(false);
    }
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
              {/* Botão Baixar PDF */}
              <button
                type="button"
                onClick={handleDirectDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-termoluc-600 hover:bg-termoluc-700 rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
                title="Baixar arquivo PDF da OS"
              >
                {downloadingPdf ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>Baixar PDF</span>
              </button>

              {/* Botão Visualizar / Imprimir */}
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-xs"
                title="Visualizar documento pronto para impressão"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Visualizar / Imprimir</span>
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

      {/* Modal de Impressão / Exportação com Preview Visual */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-3 sm:p-6 flex flex-col items-center">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden mb-6 flex flex-col">
            {/* Header da Barra de Ações (Não aparece na impressão) */}
            <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 no-print border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Visualização de PDF Oficial ({order.order_number})</span>
                <span className="text-[10px] font-semibold uppercase bg-termoluc-600/30 text-termoluc-400 px-2 py-0.5 rounded border border-termoluc-500/30">
                  Pronto para Download
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Botão de Download Direto de PDF */}
                <button
                  type="button"
                  onClick={handleDirectDownloadPdf}
                  disabled={downloadingPdf}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-termoluc-600 hover:bg-termoluc-500 rounded-xl flex items-center gap-1.5 transition-all shadow-sm shadow-termoluc-900/40 active:scale-95 disabled:opacity-50"
                  title="Baixar arquivo .pdf diretamente no seu computador"
                >
                  {downloadingPdf ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Gerando PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Baixar PDF (.pdf)</span>
                    </>
                  )}
                </button>

                {/* Botão de Impressão / Salvar PDF do Navegador */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
                  title="Abrir diálogo de impressão com layout A4 nítido"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Imprimir / Salvar PDF</span>
                </button>

                {/* Botão de Arquivar em Relatórios */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowArchiveDropdown(!showArchiveDropdown)}
                    disabled={archiving}
                    className="px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="Armazenar este PDF na central de Relatórios da Termoluc"
                  >
                    {archiving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Arquivando...</span>
                      </>
                    ) : (
                      <>
                        <FolderArchive className="w-4 h-4 text-amber-400" />
                        <span>Arquivar em Relatórios</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </>
                    )}
                  </button>

                  {/* Dropdown das 4 categorias */}
                  {showArchiveDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 p-1.5 space-y-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Salvar na Categoria:
                      </div>
                      <button
                        type="button"
                        onClick={() => handleArchiveToReports('Limpeza')}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-sky-400 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                        Limpeza & Higienização
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchiveToReports('Manutenção')}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Manutenção Técnica
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchiveToReports('Instalação')}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Instalação & Start-up
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchiveToReports('Laudo')}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Laudo Técnico & PMOC
                      </button>
                    </div>
                  )}
                </div>

                {/* Fechar */}
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors ml-1"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Documento Renderizado Pronto para Salvar / Imprimir */}
            <div className="bg-slate-100/50 p-4 sm:p-8 overflow-y-auto">
              <ServiceOrderPrintView order={order} id="service-order-printable-doc" />
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
