import React, { useRef, useState } from 'react';
import { VistoriaReportData } from '../../types';
import { generatePdfFromElement } from '../../utils/pdfGenerator';
import { Download, Printer, Loader2 } from 'lucide-react';

interface ReportVistoriaViewProps {
  data: VistoriaReportData;
  clientName?: string;
  clientAddress?: string;
  showActions?: boolean;
}

export const ReportVistoriaView: React.FC<ReportVistoriaViewProps> = ({
  data,
  clientName,
  clientAddress,
  showActions = true,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      setDownloading(true);
      const code = data.report_code || 'RT-VISTORIA';
      await generatePdfFromElement(printRef.current, `Relatorio_Vistoria_${code}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF da vistoria:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const displayAddress = clientAddress || data.address_line || 'Rua Carlos Gois, 422 - Leblon, Rio de Janeiro / RJ';
  const displayClient = clientName || 'Atendimento Comercial / Residencial';

  return (
    <div className="flex flex-col items-center w-full">
      {/* Barra de Ações (Aparece na tela mas não na impressão) */}
      {showActions && (
        <div className="w-full max-w-[800px] mb-4 flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700">Modelo Oficial de Vistoria / Laudo Técnico</span>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {data.report_code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-termoluc-600 hover:bg-termoluc-700 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Documento A4 Oficial Renderizado */}
      <div
        ref={printRef}
        id="relatorio-vistoria-document"
        className="w-full max-w-[800px] bg-white text-slate-900 shadow-md border border-slate-200/80 rounded-xl p-8 sm:p-10 font-sans print:shadow-none print:border-none print:p-6 print:m-0 print:max-w-none"
        style={{ minHeight: '1050px' }}
      >
        {/* CABEÇALHO */}
        <div className="flex items-start justify-between pb-3 border-b-2 border-sky-600 gap-4">
          <div>
            <h1 className="text-2xl font-black text-sky-600 tracking-tight leading-none">
              TERMOLUC REFRIGERAÇÃO
            </h1>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">
              MANUTENÇÃO TÉCNICA ESPECIALIZADA & ENGENHARIA TÉRMICA
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              RELATÓRIO DE VISTORIA
            </h2>
            <p className="text-xs font-extrabold text-sky-600 tracking-wide mt-0.5">
              {data.report_code}
            </p>
          </div>
        </div>

        {/* BOX PRESTADORA & CLIENTE */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs">
          {/* Empresa Prestadora */}
          <div className="border-l-2 border-sky-500 pl-3">
            <span className="block text-[10px] font-black text-sky-700 uppercase tracking-wider mb-1">
              EMPRESA PRESTADORA
            </span>
            <p className="font-bold text-slate-900">Termoluc Refrigeração e Manutenção Ltda.</p>
            <p className="text-slate-600 text-[11px]">CNPJ: 04.385.033/0001-58 | Tel: (21) 97925-0568</p>
            <p className="text-slate-600 text-[11px]">Sede: Rua Pedro Ernesto, 91 - Gamboa, Rio de Janeiro/RJ</p>
          </div>

          {/* Cliente / Local da Obra */}
          <div className="border-l-2 border-sky-500 pl-3">
            <span className="block text-[10px] font-black text-sky-700 uppercase tracking-wider mb-1">
              CLIENTE / LOCAL DA OBRA
            </span>
            <p className="font-bold text-slate-900">{displayClient}</p>
            <p className="text-slate-600 text-[11px] whitespace-pre-line">{displayAddress}</p>
          </div>
        </div>

        {/* BARRA DE STATUS RESUMO */}
        <div className="mt-4 grid grid-cols-3 gap-2 p-3 bg-slate-100/90 rounded-lg border border-slate-200 text-center">
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              DATA DE VISTORIA
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
              {data.date_formatted}
            </span>
          </div>

          <div className="border-x border-slate-200 px-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              EQUIPAMENTO VISTORIADO
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate block">
              {data.equipment_summary}
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              STATUS OPERACIONAL
            </span>
            <span className="text-xs sm:text-sm font-black text-red-600 uppercase tracking-wide">
              {data.operational_status}
            </span>
          </div>
        </div>

        {/* 1. IDENTIFICAÇÃO DO EQUIPAMENTO VISTORIADO */}
        <div className="mt-6">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-2">
            <span>1. Identificação do Equipamento Vistoriado</span>
          </h3>

          <div className="overflow-hidden rounded-md border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1f3a] text-white text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-3">AMBIENTE</th>
                  <th className="py-2 px-3">EQUIPAMENTO / MARCA</th>
                  <th className="py-2 px-3">CAPACIDADE</th>
                  <th className="py-2 px-3 text-center">CONDIÇÃO ATUAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{data.ambient}</td>
                  <td className="py-2.5 px-3 text-slate-700">{data.equipment_brand_model}</td>
                  <td className="py-2.5 px-3 text-slate-700">{data.capacity}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded">
                      {data.current_condition}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. DIAGNÓSTICO TÉCNICO APURADO */}
        <div className="mt-6">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-2">
            <span className="text-sky-600 font-black">■</span>
            <span>2. DIAGNÓSTICO TÉCNICO APURADO</span>
          </h3>

          <div className="border-l-4 border-red-500 bg-red-50/50 p-4 rounded-r-lg border-y border-r border-red-100 text-xs text-slate-800 leading-relaxed">
            <h4 className="font-extrabold text-red-600 text-xs mb-1.5 uppercase tracking-wide">
              Constatação na Vistoria:
            </h4>
            <p className="whitespace-pre-line text-slate-700 text-xs sm:text-[13px] leading-relaxed">
              {data.diagnosis}
            </p>
          </div>
        </div>

        {/* 3. PROCEDIMENTO PROPOSTO PARA CONSERTO */}
        <div className="mt-6">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-1.5">
            <span className="text-sky-600 font-black">■</span>
            <span>3. PROCEDIMENTO PROPOSTO PARA CONSERTO</span>
          </h3>

          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            Para restabelecer a plena capacidade operacional do equipamento e assegurar a garantia do serviço, faz-se necessária a execução das seguintes etapas técnicas:
          </p>

          <ol className="space-y-2 text-xs leading-relaxed text-slate-800 pl-1">
            {data.proposed_procedures.map((proc, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <span className="font-bold text-slate-900 flex-shrink-0">{index + 1}.</span>
                <div>
                  <strong className="text-slate-900">{proc.title}: </strong>
                  <span className="text-slate-700">{proc.description}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ASSINATURAS */}
        <div className="mt-14 pt-4 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="w-full border-t border-slate-400 mx-auto mb-2" />
            <p className="font-extrabold text-slate-900">Termoluc Refrigeração</p>
            <p className="text-slate-500 text-[11px]">Responsável Técnico / Engenharia</p>
          </div>

          <div>
            <div className="w-full border-t border-slate-400 mx-auto mb-2" />
            <p className="font-extrabold text-slate-900">
              {data.client_signature_name || `Cliente / ${data.ambient}`}
            </p>
            <p className="text-slate-500 text-[11px]">Aceite da Vistoria Técnica</p>
          </div>
        </div>

        {/* RODAPÉ DO DOCUMENTO */}
        <div className="mt-10 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
          <span>Termoluc Refrigeração - {displayAddress}</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
};
