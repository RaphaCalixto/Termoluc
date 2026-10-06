import React from 'react';
import { ServiceOrder } from '../../types';

interface ServiceOrderPrintViewProps {
  order: ServiceOrder;
  onClose?: () => void;
}

export const ServiceOrderPrintView: React.FC<ServiceOrderPrintViewProps> = ({ order }) => {
  const formattedDate = new Date(order.service_date).toLocaleDateString('pt-BR');
  const formattedCreated = new Date(order.created_at).toLocaleDateString('pt-BR');

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-slate-900 font-sans print:p-0 print:m-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-termoluc-600 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <img src="/TERMOLUC_logo.png" alt="Termoluc Logo" className="h-16 object-contain" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-wider">TERMOLUC REFRIGERAÇÃO</h1>
            <p className="text-xs text-slate-600">Comércio, Instalação e Manutenção Preventiva / Corretiva</p>
            <p className="text-xs text-slate-500">Telefone: (11) 98765-4321 • E-mail: contato@termoluc.com.br</p>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 block">ORDEM DE SERVIÇO</span>
            <span className="text-base font-extrabold text-termoluc-700">{order.order_number}</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">Data do Serviço: <strong>{formattedDate}</strong></p>
          <p className="text-[10px] text-slate-400">Emissão: {formattedCreated}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Dados do(s) Cliente(s) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <h2 className="text-xs font-bold text-termoluc-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
            {order.clients && order.clients.length > 1 ? 'Dados dos Clientes' : 'Dados do Cliente'}
          </h2>
          {order.clients && order.clients.length > 0 ? (
            <div className="space-y-2">
              {order.clients.map((c, i) => (
                <div key={c.id || i} className={i > 0 ? 'pt-2 border-t border-slate-200/60' : ''}>
                  <p className="text-sm font-bold text-slate-800">
                    {c.name} {order.clients && order.clients.length > 1 ? `(Cliente ${i + 1})` : ''}
                  </p>
                  {c.document && <p className="text-xs text-slate-600">CPF/CNPJ: {c.document}</p>}
                  <p className="text-xs text-slate-600">Telefone: {c.phone}</p>
                  <p className="text-xs text-slate-600">Endereço: {c.address}</p>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-800">{order.client?.name || 'Cliente não informado'}</p>
              {order.client?.document && (
                <p className="text-xs text-slate-600">CPF/CNPJ: {order.client.document}</p>
              )}
              <p className="text-xs text-slate-600">Telefone: {order.client?.phone}</p>
              <p className="text-xs text-slate-600">E-mail: {order.client?.email}</p>
              <p className="text-xs text-slate-600">Endereço: {order.client?.address}</p>
            </>
          )}
        </div>

        {/* Dados do Equipamento e Técnico */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <h2 className="text-xs font-bold text-termoluc-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
            Equipamento & Atendimento
          </h2>
          {order.equipment ? (
            <>
              <p className="text-sm font-bold text-slate-800">{order.equipment.type}</p>
              <p className="text-xs text-slate-600">Marca / Modelo: {order.equipment.brand} {order.equipment.model}</p>
              {order.equipment.serial_number && (
                <p className="text-xs text-slate-600">Nº de Série: {order.equipment.serial_number}</p>
              )}
              {order.equipment.capacity && (
                <p className="text-xs text-slate-600">Capacidade: {order.equipment.capacity}</p>
              )}
              {order.equipment.installation_location && (
                <p className="text-xs text-slate-600">Localização: {order.equipment.installation_location}</p>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500 italic">Serviço Geral / Sem maquinário cadastrado</p>
          )}
          <div className="mt-2 pt-2 border-t border-slate-200 text-xs">
            <span className="font-semibold text-slate-700">Técnico Responsável: </span>
            <span className="text-slate-900">{order.technician?.name || 'Não informado'}</span>
          </div>
          <div className="text-xs">
            <span className="font-semibold text-slate-700">Status: </span>
            <span className="font-bold text-termoluc-700">{order.status}</span>
          </div>
        </div>
      </div>

      {/* Descrição do Serviço */}
      <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Descrição dos Serviços Realizados e Diagnóstico Técnico
          </h3>
        </div>
        <div className="p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed min-h-24">
          {order.description}
        </div>
      </div>

      {/* Observações Adicionais */}
      {order.notes && (
        <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Observações e Recomendações Técnicas
            </h3>
          </div>
          <div className="p-4 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
            {order.notes}
          </div>
        </div>
      )}

      {/* Valor (se houver) */}
      {order.value !== undefined && order.value !== null && (
        <div className="mb-6 flex justify-end">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-right min-w-48">
            <span className="text-xs text-slate-500 block">VALOR TOTAL DOS SERVIÇOS</span>
            <span className="text-lg font-bold text-slate-900">
              {order.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      )}

      {/* Fotos anexadas (se houver) */}
      {order.images && order.images.length > 0 && (
        <div className="mb-8 page-break-inside-avoid">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
            Registro Fotográfico da Execução ({order.images.length} fotos)
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {order.images.map((img, i) => (
              <div key={i} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <img src={img.image_url} alt="Foto OS" className="w-full h-36 object-cover" />
                {img.caption && <p className="text-[10px] text-slate-500 p-1 text-center">{img.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assinaturas */}
      <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
        <div>
          <div className="border-b border-slate-400 mb-2 w-4/5 mx-auto"></div>
          <p className="font-bold text-slate-800">{order.technician?.name || 'Técnico Responsável'}</p>
          <p className="text-[11px] text-slate-500">Termoluc Refrigeração</p>
        </div>
        <div>
          <div className="border-b border-slate-400 mb-2 w-4/5 mx-auto"></div>
          <p className="font-bold text-slate-800">{order.client?.name || 'Cliente / Responsável Local'}</p>
          <p className="text-[11px] text-slate-500">Aceite e De Acordo</p>
        </div>
      </div>
    </div>
  );
};
