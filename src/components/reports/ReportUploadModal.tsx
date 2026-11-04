import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Report, ReportCategory, Client, Equipment, ServiceOrder, Technician } from '../../types';
import { 
  getClients, 
  getEquipmentByClientId, 
  getServiceOrders, 
  getTechnicians, 
  createReport 
} from '../../services/db';
import { uploadPdfFile } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Upload, 
  X, 
  Sparkles, 
  Wrench, 
  Snowflake, 
  ClipboardCheck, 
  CheckCircle2,
  FileCheck2
} from 'lucide-react';

interface ReportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: ReportCategory;
  onSuccess: (report: Report) => void;
  initialOrder?: ServiceOrder | null;
}

const CATEGORIES: {
  id: ReportCategory;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  activeBg: string;
  badgeColor: string;
}[] = [
  {
    id: 'Limpeza',
    name: 'Limpeza & Higienização',
    icon: Sparkles,
    description: 'Higienização preventiva, lavagem química e serpentinas',
    activeBg: 'border-sky-500 bg-sky-50/70 text-sky-900',
    badgeColor: 'bg-sky-100 text-sky-800',
  },
  {
    id: 'Manutenção',
    name: 'Manutenção Técnica',
    icon: Wrench,
    description: 'Manutenções preventivas, corretivas e reparos',
    activeBg: 'border-amber-500 bg-amber-50/70 text-amber-900',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  {
    id: 'Instalação',
    name: 'Instalação & Start-up',
    icon: Snowflake,
    description: 'Instalação de equipamentos, tubulações e infraestrutura',
    activeBg: 'border-blue-500 bg-blue-50/70 text-blue-900',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'Laudo',
    name: 'Laudo Técnico & PMOC',
    icon: ClipboardCheck,
    description: 'Laudos periciais, relatórios PMOC e conformidade técnica',
    activeBg: 'border-emerald-500 bg-emerald-50/70 text-emerald-900',
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
];

export const ReportUploadModal: React.FC<ReportUploadModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'Manutenção',
  onSuccess,
  initialOrder,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [category, setCategory] = useState<ReportCategory>(defaultCategory);
  const [title, setTitle] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [technicianName, setTechnicianName] = useState(user?.name || 'Alessandro Araújo');
  const [notes, setNotes] = useState('');

  // Relações
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  // Arquivo PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (defaultCategory) {
      setCategory(defaultCategory);
    }
  }, [defaultCategory]);

  useEffect(() => {
    async function loadData() {
      try {
        const [cData, oData, tData] = await Promise.all([
          getClients(),
          getServiceOrders(),
          getTechnicians(),
        ]);
        setClients(cData);
        setOrders(oData);
        setTechnicians(tData);
      } catch (err) {
        console.error('Erro ao carregar dados no modal de relatórios:', err);
      }
    }
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Se veio de uma OS específica, pré-preenche
  useEffect(() => {
    if (initialOrder) {
      setTitle(`Relatório Técnico - ${initialOrder.order_number}`);
      setSelectedOrderId(initialOrder.id);
      setSelectedClientId(initialOrder.client_id || '');
      setSelectedEquipmentId(initialOrder.equipment_id || '');
      if (initialOrder.technician?.name) {
        setTechnicianName(initialOrder.technician.name);
      }
      setReportDate(initialOrder.service_date || new Date().toISOString().split('T')[0]);
      setNotes(initialOrder.description || '');
    }
  }, [initialOrder]);

  // Carrega equipamentos do cliente selecionado
  useEffect(() => {
    async function loadClientEquip() {
      if (selectedClientId) {
        const list = await getEquipmentByClientId(selectedClientId);
        setEquipmentList(list);
      } else {
        setEquipmentList([]);
      }
    }
    loadClientEquip();
  }, [selectedClientId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        error('Por favor, selecione um arquivo no formato PDF (.pdf).');
        return;
      }
      setPdfFile(file);
      setPdfFileName(file.name);
      if (!title) {
        // Sugere título a partir do nome do arquivo
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      error('Informe o título do relatório.');
      return;
    }

    if (!pdfFile) {
      error('Selecione um arquivo PDF para armazenar no relatório.');
      return;
    }

    try {
      setUploading(true);

      // 1. Faz upload do arquivo para o bucket do Supabase Storage
      const uploaded = await uploadPdfFile(pdfFile, pdfFileName, category.toLowerCase());

      const clientObj = clients.find(c => c.id === selectedClientId);
      const equipObj = equipmentList.find(e => e.id === selectedEquipmentId);
      const orderObj = orders.find(o => o.id === selectedOrderId);

      // 2. Salva o registro na tabela de relatórios
      const newReport = await createReport({
        title: title.trim(),
        category,
        client_id: selectedClientId || null,
        client_name: clientObj ? clientObj.name : undefined,
        equipment_id: selectedEquipmentId || null,
        equipment_name: equipObj ? `${equipObj.brand} ${equipObj.model}` : undefined,
        service_order_id: selectedOrderId || null,
        service_order_number: orderObj ? orderObj.order_number : undefined,
        technician_name: technicianName || user?.name || 'Alesandro',
        file_url: uploaded.url,
        file_name: uploaded.name || pdfFileName,
        file_size: uploaded.size,
        report_date: reportDate,
        notes: notes.trim() || undefined,
        created_by: user?.name || 'Alesandro',
      });

      success(`Relatório "${newReport.title}" armazenado com sucesso na categoria ${category}!`);
      onSuccess(newReport);
      onClose();

      // Reset form
      setTitle('');
      setPdfFile(null);
      setPdfFileName('');
      setNotes('');
      setSelectedClientId('');
      setSelectedEquipmentId('');
      setSelectedOrderId('');
    } catch (err: any) {
      console.error('Erro ao salvar relatório:', err);
      error(err.message || 'Erro ao armazenar relatório.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Armazenar Relatório Técnico (PDF)"
      subtitle="Escolha a categoria e anexe o PDF para salvar no banco de dados da Termoluc"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Escolha da Categoria (4 Cards) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Selecione onde armazenar este relatório <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 relative ${
                    isSelected
                      ? cat.activeBg + ' shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    isSelected ? 'bg-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">{cat.name}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-termoluc-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {cat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informações Básicas do Relatório */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Título do Relatório <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Relatório de Higienização e Limpeza Dutos - Empresa ABC"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Data do Relatório / Vistoria <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={reportDate}
              onChange={e => setReportDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Técnico / Responsável <span className="text-red-500">*</span>
            </label>
            <select
              value={technicianName}
              onChange={e => setTechnicianName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm font-medium"
            >
              {technicians.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
              <option value="Alessandro Araújo">Alessandro Araújo</option>
              <option value="Carlos Alberto">Carlos Alberto</option>
              <option value="Marquinhos">Marquinhos</option>
              {user?.name && <option value={user.name}>{user.name} (Admin)</option>}
            </select>
          </div>

          {/* Vínculo de Cliente (Opcional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Cliente Vinculado <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <select
              value={selectedClientId}
              onChange={e => {
                setSelectedClientId(e.target.value);
                setSelectedEquipmentId('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm truncate"
            >
              <option value="">Nenhum (Relatório Geral / Avulso)</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Vínculo de Equipamento (Opcional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Equipamento Vinculado <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <select
              value={selectedEquipmentId}
              onChange={e => setSelectedEquipmentId(e.target.value)}
              disabled={!selectedClientId || equipmentList.length === 0}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm disabled:opacity-50"
            >
              <option value="">Nenhum</option>
              {equipmentList.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.type} — {eq.brand} ({eq.model})
                </option>
              ))}
            </select>
          </div>

          {/* Vínculo de Ordem de Serviço (Opcional) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Vincular a uma Ordem de Serviço <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <select
              value={selectedOrderId}
              onChange={e => setSelectedOrderId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm"
            >
              <option value="">Nenhuma OS vinculada</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.order_number} — {o.client?.name || 'Cliente'} ({new Date(o.service_date).toLocaleDateString('pt-BR')})
                </option>
              ))}
            </select>
          </div>

          {/* Observações / Descrição */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observações / Resumo do Laudo
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Higienização bactericida realizada com aprovação técnica. Próxima intervenção em 90 dias..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-termoluc-500 focus:ring-2 focus:ring-termoluc-200 outline-none text-sm resize-none"
            />
          </div>

          {/* Upload de Arquivo PDF */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Arquivo PDF do Relatório <span className="text-red-500">*</span></span>
              <span className="text-[11px] text-slate-400 font-normal">Armazenado no banco de dados</span>
            </label>

            {pdfFile ? (
              <div className="p-4 rounded-xl border border-termoluc-300 bg-termoluc-50/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-termoluc-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    PDF
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-900 truncate">{pdfFileName}</p>
                    <p className="text-xs text-slate-500">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB • Pronto para envio
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPdfFile(null);
                    setPdfFileName('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Trocar arquivo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-termoluc-500 hover:bg-termoluc-50/30 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 block">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="p-3 rounded-full bg-termoluc-50 text-termoluc-600">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-termoluc-600 hover:underline">
                    Clique para selecionar o PDF
                  </span> ou arraste o arquivo aqui
                  <p className="text-slate-400 mt-0.5">Formato aceito: Apenas PDF até 25MB</p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Footer com Botões */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            Categoria ativa: <strong className="text-termoluc-700">{category}</strong>
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading || !pdfFile}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-termoluc-600 hover:bg-termoluc-700 rounded-xl transition-all shadow-sm shadow-termoluc-200 active:scale-95 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enviando para o Banco...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Armazenar Relatório</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
