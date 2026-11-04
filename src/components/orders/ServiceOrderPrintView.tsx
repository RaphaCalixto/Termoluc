import React from 'react';
import { ServiceOrder } from '../../types';
import { 
  Building, 
  Wrench, 
  User, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface ServiceOrderPrintViewProps {
  order: ServiceOrder;
  id?: string;
}

export const ServiceOrderPrintView: React.FC<ServiceOrderPrintViewProps> = ({ 
  order,
  id = 'service-order-printable-doc'
}) => {
  const formattedDate = new Date(order.service_date).toLocaleDateString('pt-BR');
  const formattedCreated = new Date(order.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluída':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
          dot: 'bg-emerald-500',
          label: 'Concluída',
        };
      case 'Em andamento':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-300',
          dot: 'bg-blue-500',
          label: 'Em Andamento',
        };
      case 'Cancelada':
        return {
          bg: 'bg-red-50 text-red-700 border-red-300',
          dot: 'bg-red-500',
          label: 'Cancelada',
        };
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-300',
          dot: 'bg-amber-500',
          label: 'Pendente',
        };
    }
  };

  const statusStyle = getStatusBadge(order.status);

  return (
    <div
      id={id}
      className="bg-white text-slate-900 font-sans p-6 sm:p-8 max-w-4xl mx-auto shadow-sm border border-slate-200/80 rounded-2xl print:p-0 print:m-0 print:border-none print:shadow-none print:rounded-none"
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* Top Gradient Stripe */}
      <div className="h-2 w-full bg-gradient-to-r from-termoluc-600 via-sky-500 to-termoluc-700 rounded-t-xl mb-6 print:rounded-none"></div>

      {/* Header Corporativo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl p-1 bg-slate-50 border border-slate-200/90 flex items-center justify-center flex-shrink-0">
            <img src="/TERMOLUC_logo.png" alt="Termoluc Logo" className="max-w-full max-h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">TERMOLUC REFRIGERAÇÃO</h1>
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-termoluc-100 text-termoluc-800 border border-termoluc-200">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">Climatização, Refrigeração Comercial & Residencial</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Instalação • Manutenção Preventiva & Corretiva • PMOC • Higienização
            </p>
          </div>
        </div>

        {/* Bloco de Identificação da OS */}
        <div className="text-left sm:text-right bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 min-w-56">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Ordem de Serviço Oficial
          </div>
          <div className="text-lg font-black text-termoluc-700 tracking-tight">
            {order.order_number}
          </div>

          <div className="mt-1.5 flex items-center sm:justify-end gap-1.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusStyle.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
              {statusStyle.label}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
            <div>Data do Serviço: <strong className="text-slate-800">{formattedDate}</strong></div>
            <div className="text-[10px] text-slate-400">Emissão: {formattedCreated}</div>
          </div>
        </div>
      </div>

      {/* Grid de Informações: Cliente & Equipamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {/* Card do Cliente */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2 text-termoluc-700 font-bold text-xs uppercase tracking-wider mb-2.5 border-b border-slate-200 pb-1.5">
            <Building className="w-4 h-4 text-termoluc-600" />
            <span>{order.clients && order.clients.length > 1 ? `Clientes Vinculados (${order.clients.length})` : 'Dados do Cliente'}</span>
          </div>

          {order.clients && order.clients.length > 0 ? (
            <div className="space-y-3">
              {order.clients.map((c, i) => (
                <div key={c.id || i} className={i > 0 ? 'pt-2.5 border-t border-slate-200/70' : ''}>
                  <p className="text-sm font-bold text-slate-900">
                    {c.name} {order.clients && order.clients.length > 1 ? `(Cliente ${i + 1})` : ''}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">Endereço: <strong>{c.address}</strong></p>
                  <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                    <span>Telefone: <strong>{c.phone || 'Não informado'}</strong></span>
                    {c.document && <span>CPF/CNPJ: <strong>{c.document}</strong></span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">{order.client?.name || 'Cliente Geral'}</p>
              <p className="text-xs text-slate-600">Endereço: <strong>{order.client?.address || 'Não cadastrado'}</strong></p>
              <div className="text-xs text-slate-600 pt-0.5 flex flex-wrap gap-x-4 gap-y-0.5">
                <span>Tel: <strong>{order.client?.phone || 'Não inf.'}</strong></span>
                {order.client?.document && <span>Doc: <strong>{order.client?.document}</strong></span>}
                {order.client?.email && <span>E-mail: <strong>{order.client?.email}</strong></span>}
              </div>
            </div>
          )}
        </div>

        {/* Card do Equipamento e Atendimento */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2 text-termoluc-700 font-bold text-xs uppercase tracking-wider mb-2.5 border-b border-slate-200 pb-1.5">
            <Wrench className="w-4 h-4 text-termoluc-600" />
            <span>Equipamento & Atendimento Técnico</span>
          </div>

          {order.equipment ? (
            <div className="space-y-1 text-xs text-slate-700">
              <p className="text-sm font-bold text-slate-900">{order.equipment.type}</p>
              <p>Marca / Modelo: <strong className="text-slate-900">{order.equipment.brand} • {order.equipment.model}</strong></p>
              {order.equipment.capacity && (
                <p>Capacidade Térmica: <strong className="text-slate-900">{order.equipment.capacity}</strong></p>
              )}
              {order.equipment.serial_number && (
                <p>Nº de Série: <strong className="text-slate-900">{order.equipment.serial_number}</strong></p>
              )}
              {order.equipment.installation_location && (
                <p>Local de Instalação: <strong className="text-slate-900">{order.equipment.installation_location}</strong></p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-1">Serviço Geral / Sem maquinário individual vinculado</p>
          )}

          <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Técnico Responsável: <strong className="text-slate-900">{order.technician?.name || 'Não informado'}</strong></span>
            </div>
            {order.created_by && (
              <span className="text-[11px] text-slate-400">ADM: {order.created_by}</span>
            )}
          </div>
        </div>
      </div>

      {/* Descrição Detalhada dos Serviços */}
      <div className="mb-5 rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-termoluc-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Descrição dos Serviços Executados e Parecer Técnico
          </h2>
        </div>
        <div className="p-4 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed min-h-24 bg-white">
          {order.description}
        </div>
      </div>

      {/* Observações / Recomendações Técnicas */}
      {order.notes && (
        <div className="mb-5 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Observações Técnicas & Recomendações Preventivas
          </h3>
          <p className="text-xs text-amber-900/90 whitespace-pre-wrap leading-relaxed">
            {order.notes}
          </p>
        </div>
      )}

      {/* Valor Total Cobrado (se informado) */}
      {order.value !== undefined && order.value !== null && (
        <div className="mb-6 flex justify-end">
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 px-5 text-right flex items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Valor Total do Serviço
              </span>
              <span className="text-xl font-black text-emerald-900">
                {order.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Registro Fotográfico da Execução */}
      {order.images && order.images.length > 0 && (
        <div className="mb-6 page-break-inside-avoid">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <span>Registro Fotográfico da Execução ({order.images.length} fotos anexadas)</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {order.images.map((img, i) => (
              <div key={i} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col">
                <div className="aspect-video w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                  <img
                    src={img.image_url}
                    alt={`Foto OS ${i + 1}`}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                </div>
                {img.caption && (
                  <p className="text-[10px] text-slate-500 p-1.5 text-center bg-white border-t border-slate-100">
                    {img.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Termo de Conformidade e Garantia */}
      <div className="my-6 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[10px] text-slate-500 leading-relaxed flex items-center gap-2.5">
        <ShieldCheck className="w-5 h-5 text-termoluc-600 flex-shrink-0" />
        <div>
          <strong>Garantia de Execução Termoluc:</strong> Os serviços foram realizados em total conformidade com as normas técnicas de climatização (ABNT / PMOC). Para dúvidas, suporte ou novas solicitações, entre em contato através dos canais oficiais da Termoluc Refrigeração.
        </div>
      </div>

      {/* Assinaturas Formais */}
      <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs text-slate-700 page-break-inside-avoid">
        <div className="flex flex-col items-center">
          <div className="border-b border-slate-400 w-4/5 mb-1.5"></div>
          <p className="font-bold text-slate-900">{order.technician?.name || 'Técnico Responsável'}</p>
          <p className="text-[10px] text-slate-500">Termoluc Refrigeração & Climatização</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="border-b border-slate-400 w-4/5 mb-1.5"></div>
          <p className="font-bold text-slate-900">{order.client?.name || 'Cliente / Responsável Autorizado'}</p>
          <p className="text-[10px] text-slate-500">De acordo com a execução do serviço</p>
        </div>
      </div>

      {/* Rodapé do Documento */}
      <div className="mt-8 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-1">
        <span>Termoluc Refrigeração • Documento Oficial de Ordem de Serviço</span>
        <span>Autenticidade: {order.id.slice(0, 8).toUpperCase()} • Gerado via Sistema Termoluc</span>
      </div>
    </div>
  );
};
