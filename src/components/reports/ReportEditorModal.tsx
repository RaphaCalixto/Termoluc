import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { 
  Client, 
  Equipment, 
  ServiceOrder, 
  Report, 
  VistoriaReportData, 
  LimpezaReportData, 
  LimpezaEquipmentItem 
} from '../../types';
import { getClients, getEquipmentByClientId, getServiceOrders, createReport } from '../../services/db';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ReportVistoriaView } from './ReportVistoriaView';
import { ReportLimpezaView } from './ReportLimpezaView';
import { 
  FileCheck2, 
  Eye, 
  Edit3, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Sparkles, 
  ClipboardCheck,
  Building,
  Loader2
} from 'lucide-react';
import { generatePdfFromElement } from '../../utils/pdfGenerator';

interface ReportEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'vistoria' | 'limpeza';
  initialEquipment?: Equipment | null;
  initialClient?: Client | null;
  onSuccess?: (report: Report) => void;
}

export const ReportEditorModal: React.FC<ReportEditorModalProps> = ({
  isOpen,
  onClose,
  initialType = 'vistoria',
  initialEquipment = null,
  initialClient = null,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [reportType, setReportType] = useState<'vistoria' | 'limpeza'>(initialType);

  // Clientes & Equipamentos
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  const [saving, setSaving] = useState(false);

  // ===================== DADOS MODELO 1: VISTORIA / LAUDO =====================
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const capitalizedMonthYear = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  const [vistoriaData, setVistoriaData] = useState<VistoriaReportData>({
    report_code: `RT-${currentYear}/${Math.floor(100 + Math.random() * 900)}-LEB`,
    date_formatted: capitalizedMonthYear,
    equipment_summary: 'Samsung Wind Free 18k',
    operational_status: 'REQUER INTERVENÇÃO',
    ambient: 'Sala Administração',
    equipment_brand_model: 'Ar Split Samsung Wind Free',
    capacity: '18.000 BTUs',
    current_condition: 'DESCONTINUADO / FALHA',
    diagnosis:
      'Após testes e medições elétricas no sistema frigorífico da unidade Split Samsung Wind Free 18.000 BTUs localizada na Sala da Administração, foi verificado compressor com desequilíbrio na resistência elétrica das três bobinas. O desbalanço impediu a operação nominal da unidade e comprometeu a compressão adequada do fluido refrigerante.',
    proposed_procedures: [
      {
        title: 'Desinstalação e Instalação de Compressor',
        description: 'Remoção da unidade compressora avariada e montagem mecânica do novo compressor compatível.',
      },
      {
        title: 'Execução de Soldas Frigoríficas',
        description: 'Brasagem de alta precisão com liga de prata nos acoplamentos do sistema frigorífico.',
      },
      {
        title: 'Pressurização com Nitrogênio',
        description: 'Teste de estanqueidade em alta pressão para verificação rigorosa de microvazamentos.',
      },
      {
        title: 'Auto Vácuo do Sistema',
        description: 'Desidratação completa da tubulação com bomba de vácuo até atingir os níveis recomendados pelo fabricante.',
      },
      {
        title: 'Carga Completa de Gás',
        description: 'Recomposição total do fluido refrigerante por massa (balança de precisão).',
      },
    ],
    client_signature_name: 'Cliente / Sala Administração',
    address_line: 'Rua Carlos Gois, 422 - Leblon, Rio de Janeiro / RJ',
  });

  // ===================== DADOS MODELO 2: LIMPEZA & HIGIENIZAÇÃO =====================
  const [limpezaData, setLimpezaData] = useState<LimpezaReportData>({
    report_code: `RT-${currentYear}/${Math.floor(100 + Math.random() * 900)}-BOT`,
    subtitle: 'Serviço Técnico de Sanitização e Aferição Operacional em Sistemas Split Hi-Wall',
    date_formatted: capitalizedMonthYear,
    operational_status: '100% CONCLUÍDO & OPERACIONAL',
    client_address_full: 'Av. Lauro Sodré, nº 150, Bloco 3, Apt 209\nBotafogo, Rio de Janeiro / RJ – CEP: 22290-070',
    kpi_evaporators_clean: '06 Unid.',
    kpi_condensers_clean: '06 Unid.',
    kpi_pressure: '130 PSI',
    kpi_efficiency: '100%',
    initial_scope:
      'A Termoluc Refrigeração e Manutenção Ltda. realizou a manutenção preventiva e higienização completa em condicionadores de ar tipo Split Hi-Wall no imóvel informado. O procedimento visou a remoção de contaminações biológicas, otimização da troca térmica e aferição dos parâmetros operacionais de pressão de fluido refrigerante R410A.',
    items: [
      {
        id: '1',
        ambient: 'Sala TV',
        equipment_model: 'LG Split Hi-Wall 18.000 BTUs',
        service_executed: 'Higienização + Lavagem',
        pressure: '130 PSI - OK',
        condenser_status: 'LIMPA',
        general_status: 'OK',
      },
      {
        id: '2',
        ambient: 'Sala Cozinha',
        equipment_model: 'LG Split Hi-Wall 18.000 BTUs',
        service_executed: 'Higienização + Lavagem',
        pressure: '130 PSI - OK',
        condenser_status: 'LIMPA',
        general_status: 'OK',
      },
      {
        id: '3',
        ambient: 'Escritório',
        equipment_model: 'LG Split Hi-Wall 12.000 BTUs',
        service_executed: 'Higienização + Lavagem',
        pressure: '130 PSI - OK',
        condenser_status: 'LIMPA',
        general_status: 'OK',
      },
      {
        id: '4',
        ambient: 'Quarto Filho',
        equipment_model: 'LG Split Hi-Wall 12.000 BTUs',
        service_executed: 'Higienização + Lavagem',
        pressure: '130 PSI - OK',
        condenser_status: 'LIMPA',
        general_status: 'OK',
      },
      {
        id: '5',
        ambient: 'Quarto Filha',
        equipment_model: 'LG Split Hi-Wall 12.000 BTUs',
        service_executed: 'Higienização + Lavagem',
        pressure: '130 PSI - OK',
        condenser_status: 'LIMPA',
        general_status: 'OK',
      },
      {
        id: '6',
        ambient: 'Suíte',
        equipment_model: 'LG Split Hi-Wall 24.000 BTUs',
        service_executed: 'Higienização + Lavagem',
        pressure: '130 PSI - OK',
        condenser_status: 'LIMPA',
        general_status: 'OK',
      },
    ],
    procedures: [
      {
        title: 'Higienização Químico-Bactericida',
        description:
          'Aplicação de agente sanitizante biodegradável específico nas evaporadoras, eliminando ácaros, fungos e bactérias depositados nas serpentinas e filtros de ar.',
      },
      {
        title: 'Lavagem Pressurizada de Condensadoras',
        description:
          'Limpeza técnica sob pressão em todas as unidades externas (condensadoras), removendo incrustações de poeira e fuligem que impediam a troca de calor ideal.',
      },
      {
        title: 'Aferição de Pressão de Fluido (R410A)',
        description:
          'Verificação com manifold analógico/digital na linha de sucção de todas as unidades, constatando estanqueidade e pressão perfeita de 130 PSI (padrão nominal R410A).',
      },
      {
        title: 'Desobstrução e Teste de Dreno',
        description:
          'Higienização das calhas coletores e drenos de condensado com liberação mecânica e enxágue pressurizado, garantindo o escoamento sem riscos de gotejamento interno.',
      },
    ],
    conclusion:
      'Atestamos que os condicionadores de ar tipo Split Hi-Wall foram devidamente higienizados e testados. Todas as unidades externas (condensadoras) encontram-se limpas e operando com pressão estável de 130 PSI de gás R410A, apresentando excelente gradiente térmico de refrigeração e baixo consumo elétrico.',
    preventive_recommendations: [
      'Limpeza Quinzenal de Filtros: Efetuar a lavagem periódica dos filtros de tela em água corrente para manter a vazão contínua e evitar sobrecarga nos motores ventiladores.',
      'Manutenção Periódica Especializada: Recomenda-se nova higienização técnica profissional a cada 6 (seis) meses para preservação da saúde dos ocupantes e eficiência energética do sistema.',
      'Operação Adequada: Manter portas e janelas fechadas durante o uso para assegurar o rendimento térmico do sistema.',
    ],
    city_date: `Rio de Janeiro, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`,
  });

  // Carrega clientes e dados iniciais ao abrir
  useEffect(() => {
    async function init() {
      try {
        const [cList, oList] = await Promise.all([getClients(), getServiceOrders()]);
        setClients(cList);
        setOrders(oList);

        if (initialClient) {
          setSelectedClientId(initialClient.id);
          applyClientData(initialClient);
        } else if (cList.length > 0 && !selectedClientId) {
          setSelectedClientId(cList[0].id);
          applyClientData(cList[0]);
        }

        if (initialEquipment) {
          setSelectedEquipmentId(initialEquipment.id);
          if (initialEquipment.client_id) {
            setSelectedClientId(initialEquipment.client_id);
            const foundClient = cList.find(c => c.id === initialEquipment.client_id);
            if (foundClient) applyClientData(foundClient);
          }
          applyEquipmentData(initialEquipment);
        }
      } catch (err) {
        console.error('Erro ao inicializar editor de relatórios:', err);
      }
    }

    if (isOpen) {
      if (initialType) setReportType(initialType);
      init();
    }
  }, [isOpen, initialType, initialEquipment, initialClient]);

  // Carrega equipamentos do cliente selecionado
  useEffect(() => {
    async function loadEquip() {
      if (selectedClientId) {
        const list = await getEquipmentByClientId(selectedClientId);
        setEquipmentList(list);
      } else {
        setEquipmentList([]);
      }
    }
    loadEquip();
  }, [selectedClientId]);

  const applyClientData = (client: Client) => {
    const addressStr = client.address || 'Rio de Janeiro / RJ';

    setVistoriaData(prev => ({
      ...prev,
      address_line: addressStr,
      client_signature_name: client.name ? `Cliente / ${client.name}` : prev.client_signature_name,
    }));

    setLimpezaData(prev => ({
      ...prev,
      client_address_full: addressStr,
    }));
  };

  const applyEquipmentData = (equip: Equipment) => {
    const summary = `${equip.brand || ''} ${equip.model || ''} ${equip.capacity || ''}`.trim();
    const location = equip.installation_location || 'Ambiente Principal';

    setVistoriaData(prev => ({
      ...prev,
      equipment_summary: summary || prev.equipment_summary,
      equipment_brand_model: `${equip.brand || ''} ${equip.model || ''}`.trim() || prev.equipment_brand_model,
      capacity: equip.capacity || prev.capacity,
      ambient: location,
    }));

    setLimpezaData(prev => {
      // Se não tiver items ou só os padrões, substitui o primeiro pelo equipamento real
      const updatedItems = [...prev.items];
      if (updatedItems.length > 0) {
        updatedItems[0] = {
          ...updatedItems[0],
          ambient: location,
          equipment_model: summary || updatedItems[0].equipment_model,
        };
      }
      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

  const handleClientChange = (cId: string) => {
    setSelectedClientId(cId);
    setSelectedEquipmentId('');
    const client = clients.find(c => c.id === cId);
    if (client) {
      applyClientData(client);
    }
  };

  const handleEquipmentChange = (eId: string) => {
    setSelectedEquipmentId(eId);
    const equip = equipmentList.find(e => e.id === eId);
    if (equip) {
      applyEquipmentData(equip);
    }
  };

  // Funções de manipulação do Modelo 2 (Itens de Equipamento)
  const handleAddItemLimpeza = () => {
    const newItem: LimpezaEquipmentItem = {
      id: String(Date.now()),
      ambient: 'Novo Ambiente',
      equipment_model: 'Split Hi-Wall 12.000 BTUs',
      service_executed: 'Higienização + Lavagem',
      pressure: '130 PSI - OK',
      condenser_status: 'LIMPA',
      general_status: 'OK',
    };
    setLimpezaData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
      kpi_evaporators_clean: `${String(prev.items.length + 1).padStart(2, '0')} Unid.`,
      kpi_condensers_clean: `${String(prev.items.length + 1).padStart(2, '0')} Unid.`,
    }));
  };

  const handleRemoveItemLimpeza = (index: number) => {
    setLimpezaData(prev => {
      const items = prev.items.filter((_, i) => i !== index);
      return {
        ...prev,
        items,
        kpi_evaporators_clean: `${String(items.length).padStart(2, '0')} Unid.`,
        kpi_condensers_clean: `${String(items.length).padStart(2, '0')} Unid.`,
      };
    });
  };

  const handleUpdateItemLimpeza = (index: number, field: keyof LimpezaEquipmentItem, val: string) => {
    setLimpezaData(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: val };
      return { ...prev, items };
    });
  };

  // Funções de manipulação de Procedimentos
  const handleAddProcedureVistoria = () => {
    setVistoriaData(prev => ({
      ...prev,
      proposed_procedures: [
        ...prev.proposed_procedures,
        { title: 'Nova Etapa Técnica', description: 'Descreva a etapa técnica a ser executada.' },
      ],
    }));
  };

  const handleRemoveProcedureVistoria = (index: number) => {
    setVistoriaData(prev => ({
      ...prev,
      proposed_procedures: prev.proposed_procedures.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateProcedureVistoria = (index: number, field: 'title' | 'description', val: string) => {
    setVistoriaData(prev => {
      const procedures = [...prev.proposed_procedures];
      procedures[index] = { ...procedures[index], [field]: val };
      return { ...prev, proposed_procedures: procedures };
    });
  };

  // Salvar no banco
  const handleSave = async (andDownload: boolean = false) => {
    try {
      setSaving(true);

      const clientObj = clients.find(c => c.id === selectedClientId);
      const equipObj = equipmentList.find(e => e.id === selectedEquipmentId);
      const orderObj = orders.find(o => o.id === selectedOrderId);

      const code = reportType === 'vistoria' ? vistoriaData.report_code : limpezaData.report_code;
      const title =
        reportType === 'vistoria'
          ? `Laudo de Vistoria - ${code}`
          : `Higienização e Manutenção Preventiva - ${code}`;

      const created = await createReport({
        title,
        category: reportType === 'vistoria' ? 'Laudo' : 'Limpeza',
        report_type: reportType,
        report_code: code,
        client_id: selectedClientId || undefined,
        client_name: clientObj?.name || (reportType === 'vistoria' ? 'Atendimento Comercial / Residencial' : 'Atendimento Residencial'),
        equipment_id: selectedEquipmentId || undefined,
        equipment_name: equipObj ? `${equipObj.brand || ''} ${equipObj.model || ''}`.trim() : undefined,
        service_order_id: selectedOrderId || undefined,
        service_order_number: orderObj?.order_number || undefined,
        technician_name: user?.name || 'Alessandro Araújo',
        file_url: '#', // Indicador de relatório gerado pelo sistema
        file_name: `${title.replace(/\s+/g, '_')}.pdf`,
        report_date: new Date().toISOString().split('T')[0],
        notes: `Relatório oficial emitido eletronicamente via sistema Termoluc. Código: ${code}`,
        vistoria_data: reportType === 'vistoria' ? vistoriaData : undefined,
        limpeza_data: reportType === 'limpeza' ? limpezaData : undefined,
      });

      success(`Relatório "${title}" salvo no sistema com sucesso!`);

      if (andDownload) {
        // Dispara geração do PDF a partir da tela
        const elemId = reportType === 'vistoria' ? 'relatorio-vistoria-document' : 'relatorio-limpeza-document';
        // Se estiver na aba editor, muda temporariamente para gerar
        setActiveTab('preview');
        setTimeout(async () => {
          const el = document.getElementById(elemId);
          if (el) {
            await generatePdfFromElement(el, `${title.replace(/\s+/g, '_')}.pdf`);
          }
        }, 300);
      }

      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar relatório:', err);
      error(err.message || 'Erro ao salvar relatório.');
    } finally {
      setSaving(false);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Emissão de Relatório Técnico Oficial"
      subtitle="Gere laudos periciais ou relatórios de higienização com formatação profissional Termoluc"
      maxWidth="5xl"
    >
      <div className="space-y-4">
        {/* Seletor de Modelo e Abas Superiores */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          {/* Seletor de Modelo */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Modelo:
            </span>
            <button
              type="button"
              onClick={() => setReportType('vistoria')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportType === 'vistoria'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Laudo / Vistoria Técnica</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('limpeza')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                reportType === 'limpeza'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Limpeza & Higienização</span>
            </button>
          </div>

          {/* Abas Editor vs Preview */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'editor'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Dados</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'preview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pré-visualizar Documento</span>
            </button>
          </div>
        </div>

        {/* ===================== ABA 1: FORMULÁRIO DE EDIÇÃO ===================== */}
        {activeTab === 'editor' && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            {/* Vinculação de Cliente e Equipamento */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-termoluc-600" />
                Vínculo de Atendimento (Cliente & Equipamento)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    CLIENTE *
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={e => handleClientChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-termoluc-500 font-medium text-slate-900"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    EQUIPAMENTO ESPECÍFICO (OPCIONAL)
                  </label>
                  <select
                    value={selectedEquipmentId}
                    onChange={e => handleEquipmentChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-termoluc-500 font-medium text-slate-900"
                  >
                    <option value="">Geral / Múltiplos equipamentos</option>
                    {equipmentList.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.brand} {eq.model} ({eq.installation_location || eq.type || 'Equipamento'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    VINCULAR ORDEM DE SERVIÇO (OPCIONAL)
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={e => setSelectedOrderId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-termoluc-500 font-medium text-slate-900"
                  >
                    <option value="">Nenhuma OS vinculada</option>
                    {orders
                      .filter(o => !selectedClientId || o.client_id === selectedClientId)
                      .map(o => (
                        <option key={o.id} value={o.id}>
                          OS #{o.order_number} ({o.status})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SE REPORT TYPE === 'vistoria' (MODELO 1) */}
            {reportType === 'vistoria' && (
              <div className="space-y-4">
                {/* Cabeçalho do Laudo */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-red-600" />
                    Identificação do Laudo e Equipamento
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        CÓDIGO DO RELATÓRIO
                      </label>
                      <input
                        type="text"
                        value={vistoriaData.report_code}
                        onChange={e => setVistoriaData({ ...vistoriaData, report_code: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 font-bold text-sky-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        DATA FORMATADA
                      </label>
                      <input
                        type="text"
                        value={vistoriaData.date_formatted}
                        onChange={e => setVistoriaData({ ...vistoriaData, date_formatted: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 font-bold"
                        placeholder="Ex: Outubro de 2026"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        STATUS OPERACIONAL
                      </label>
                      <input
                        type="text"
                        value={vistoriaData.operational_status}
                        onChange={e => setVistoriaData({ ...vistoriaData, operational_status: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 font-black text-red-600 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        EQUIPAMENTO RESUMO
                      </label>
                      <input
                        type="text"
                        value={vistoriaData.equipment_summary}
                        onChange={e => setVistoriaData({ ...vistoriaData, equipment_summary: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 font-bold"
                      />
                    </div>
                  </div>

                  {/* Endereço e Dados da Tabela */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        AMBIENTE
                      </label>
                      <input
                        type="text"
                        value={vistoriaData.ambient}
                        onChange={e => setVistoriaData({ ...vistoriaData, ambient: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        EQUIPAMENTO / MARCA
                      </label>
                      <input
                        type="text"
                        value={vistoriaData.equipment_brand_model}
                        onChange={e => setVistoriaData({ ...vistoriaData, equipment_brand_model: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        CAPACIDADE
                      </label>
                      <input
                        type="text"
                        value={vistoriaData.capacity}
                        onChange={e => setVistoriaData({ ...vistoriaData, capacity: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 font-medium"
                        placeholder="Ex: 18.000 BTUs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        CONDIÇÃO ATUAL
                      </label>
                      <input
                        type="text"
                        value={vistoriaData.current_condition}
                        onChange={e => setVistoriaData({ ...vistoriaData, current_condition: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 font-bold text-red-600"
                        placeholder="DESCONTINUADO / FALHA"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ENDEREÇO COMPLETO DO LOCAL DA OBRA
                    </label>
                    <input
                      type="text"
                      value={vistoriaData.address_line || ''}
                      onChange={e => setVistoriaData({ ...vistoriaData, address_line: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                </div>

                {/* 2. Diagnóstico Técnico Apurado */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-red-600">
                    ■ 2. Diagnóstico Técnico Apurado (Constatação na Vistoria)
                  </h4>
                  <textarea
                    rows={4}
                    value={vistoriaData.diagnosis}
                    onChange={e => setVistoriaData({ ...vistoriaData, diagnosis: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-red-500 font-medium"
                    placeholder="Descreva detalhadamente a constatação na vistoria..."
                  />
                </div>

                {/* 3. Procedimentos Propostos para Conserto */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      ■ 3. Procedimentos Propostos para Conserto
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddProcedureVistoria}
                      className="inline-flex items-center gap-1 text-xs font-bold text-termoluc-600 hover:text-termoluc-700 bg-termoluc-50 hover:bg-termoluc-100 px-2.5 py-1 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Etapa
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {vistoriaData.proposed_procedures.map((proc, index) => (
                      <div key={index} className="flex items-start gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70">
                        <span className="font-bold text-slate-500 text-xs mt-2">{index + 1}.</span>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={proc.title}
                            onChange={e => handleUpdateProcedureVistoria(index, 'title', e.target.value)}
                            placeholder="Título da Etapa"
                            className="p-1.5 rounded-lg border border-slate-200 font-bold text-xs bg-white text-slate-900"
                          />
                          <input
                            type="text"
                            value={proc.description}
                            onChange={e => handleUpdateProcedureVistoria(index, 'description', e.target.value)}
                            placeholder="Descrição detalhada do procedimento"
                            className="p-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 sm:col-span-2"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProcedureVistoria(index)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                          title="Remover etapa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SE REPORT TYPE === 'limpeza' (MODELO 2) */}
            {reportType === 'limpeza' && (
              <div className="space-y-4">
                {/* Cabeçalho e Indicadores */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    Cabeçalho e Indicadores Chave (KPIs)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        CÓDIGO RELATÓRIO
                      </label>
                      <input
                        type="text"
                        value={limpezaData.report_code}
                        onChange={e => setLimpezaData({ ...limpezaData, report_code: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 font-bold text-sky-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        DATA EXECUÇÃO
                      </label>
                      <input
                        type="text"
                        value={limpezaData.date_formatted}
                        onChange={e => setLimpezaData({ ...limpezaData, date_formatted: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        STATUS GERAL OPERACIONAL
                      </label>
                      <input
                        type="text"
                        value={limpezaData.operational_status}
                        onChange={e => setLimpezaData({ ...limpezaData, operational_status: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200 font-black text-emerald-600 uppercase"
                      />
                    </div>
                  </div>

                  {/* 4 Cards de KPI */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Evaporadoras Limpas
                      </label>
                      <input
                        type="text"
                        value={limpezaData.kpi_evaporators_clean}
                        onChange={e => setLimpezaData({ ...limpezaData, kpi_evaporators_clean: e.target.value })}
                        className="w-full p-1.5 rounded-lg border border-slate-200 font-black text-center text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Condensadoras Limpas
                      </label>
                      <input
                        type="text"
                        value={limpezaData.kpi_condensers_clean}
                        onChange={e => setLimpezaData({ ...limpezaData, kpi_condensers_clean: e.target.value })}
                        className="w-full p-1.5 rounded-lg border border-slate-200 font-black text-center text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Pressão Gás (Aferido)
                      </label>
                      <input
                        type="text"
                        value={limpezaData.kpi_pressure}
                        onChange={e => setLimpezaData({ ...limpezaData, kpi_pressure: e.target.value })}
                        className="w-full p-1.5 rounded-lg border border-slate-200 font-black text-center text-sky-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Eficiência Térmica
                      </label>
                      <input
                        type="text"
                        value={limpezaData.kpi_efficiency}
                        onChange={e => setLimpezaData({ ...limpezaData, kpi_efficiency: e.target.value })}
                        className="w-full p-1.5 rounded-lg border border-slate-200 font-black text-center text-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ENDEREÇO COMPLETO DO CLIENTE
                    </label>
                    <textarea
                      rows={2}
                      value={limpezaData.client_address_full}
                      onChange={e => setLimpezaData({ ...limpezaData, client_address_full: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                </div>

                {/* 1. Escopo Inicial */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    1. Escopo Técnico e Inspeção Inicial
                  </h4>
                  <textarea
                    rows={3}
                    value={limpezaData.initial_scope}
                    onChange={e => setLimpezaData({ ...limpezaData, initial_scope: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed"
                  />
                </div>

                {/* 2. Tabela de Equipamentos Atendidos */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      2. Detalhamento dos Equipamentos Atendidos
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddItemLimpeza}
                      className="inline-flex items-center gap-1 text-xs font-bold text-termoluc-600 hover:text-termoluc-700 bg-termoluc-50 hover:bg-termoluc-100 px-2.5 py-1 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Equipamento
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {limpezaData.items.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                      >
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            value={item.ambient}
                            onChange={e => handleUpdateItemLimpeza(index, 'ambient', e.target.value)}
                            placeholder="Ambiente (ex: Sala TV)"
                            className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            value={item.equipment_model}
                            onChange={e => handleUpdateItemLimpeza(index, 'equipment_model', e.target.value)}
                            placeholder="Modelo (ex: LG Split 18k)"
                            className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={item.service_executed}
                            onChange={e => handleUpdateItemLimpeza(index, 'service_executed', e.target.value)}
                            placeholder="Serviço"
                            className="w-full p-1.5 rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={item.pressure}
                            onChange={e => handleUpdateItemLimpeza(index, 'pressure', e.target.value)}
                            placeholder="Pressão (130 PSI)"
                            className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-bold text-sky-800"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <input
                            type="text"
                            value={item.condenser_status}
                            onChange={e => handleUpdateItemLimpeza(index, 'condenser_status', e.target.value)}
                            placeholder="Cond."
                            className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-bold text-emerald-800 text-center"
                          />
                        </div>
                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemLimpeza(index)}
                            disabled={limpezaData.items.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Conclusão e Parecer */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    4. Parecer Técnico e Conclusão de Desempenho
                  </h4>
                  <textarea
                    rows={3}
                    value={limpezaData.conclusion}
                    onChange={e => setLimpezaData({ ...limpezaData, conclusion: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== ABA 2: PRÉ-VISUALIZAÇÃO OFICIAL ===================== */}
        {activeTab === 'preview' && (
          <div className="max-h-[72vh] overflow-y-auto p-4 bg-slate-100 rounded-2xl border border-slate-200 flex justify-center">
            {reportType === 'vistoria' ? (
              <ReportVistoriaView
                data={vistoriaData}
                clientName={selectedClient?.name}
                clientAddress={vistoriaData.address_line}
                showActions={false}
              />
            ) : (
              <ReportLimpezaView
                data={limpezaData}
                clientName={selectedClient?.name}
                showActions={false}
              />
            )}
          </div>
        )}

        {/* Rodapé de Ações do Modal */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            * O relatório será armazenado no banco de dados e poderá ser baixado em PDF ou impresso a qualquer momento.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Salvar & Baixar PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-termoluc-600 hover:bg-termoluc-700 text-white text-xs font-bold transition-colors shadow-sm shadow-termoluc-200 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar no Sistema</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
