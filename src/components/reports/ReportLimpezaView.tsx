import React, { useRef, useState } from 'react';
import { LimpezaReportData } from '../../types';
import { generatePdfFromElement } from '../../utils/pdfGenerator';
import { Download, Printer, Loader2 } from 'lucide-react';

interface ReportLimpezaViewProps {
  data: LimpezaReportData;
  clientName?: string;
  showActions?: boolean;
}

export const ReportLimpezaView: React.FC<ReportLimpezaViewProps> = ({
  data,
  clientName,
  showActions = true,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      setDownloading(true);
      const code = data.report_code || 'RT-LIMPEZA';
      await generatePdfFromElement(printRef.current, `Relatorio_Higienizacao_${code}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF de limpeza:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const displayClient = clientName || 'Atendimento Residencial / Predial';

  return (
    <div className="flex flex-col items-center w-full">
      {/* Barra de Ações Superior */}
      {showActions && (
        <div className="w-full max-w-[820px] mb-4 flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700">Modelo Oficial de Higienização & Manutenção</span>
            <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
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

      {/* Container Geral de Impressão */}
      <div
        ref={printRef}
        id="relatorio-limpeza-document"
        className="w-full max-w-[820px] flex flex-col gap-8 print:gap-0 print:m-0 print:max-w-none"
      >
        {/* ==================== PÁGINA 1 ==================== */}
        <div
          className="w-full bg-white text-slate-900 shadow-md border border-slate-200/80 rounded-xl p-8 sm:p-10 font-sans print:shadow-none print:border-none print:p-6 print:m-0 print:break-after-page"
          style={{ minHeight: '1050px' }}
        >
          {/* BANNER SUPERIOR AZUL MARINHO */}
          <div className="bg-[#0b1b36] text-white rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight uppercase">
                TERMOLUC REFRIGERAÇÃO
              </h1>
              <p className="text-xs text-sky-300 font-medium mt-0.5">
                Manutenção Técnica Especializada & Engenharia Térmica
              </p>
            </div>

            <div className="bg-[#162a4d] border border-sky-400/30 rounded-xl px-4 py-2 text-right flex-shrink-0">
              <span className="block text-[10px] font-black text-sky-300 uppercase tracking-wider">
                RELATÓRIO TÉCNICO
              </span>
              <span className="block text-sm font-extrabold text-white tracking-wide">
                {data.report_code}
              </span>
            </div>
          </div>

          {/* TÍTULO COM BARRA AZUL VERTICAL */}
          <div className="mt-6 flex items-start gap-3">
            <div className="w-1.5 self-stretch bg-sky-600 rounded-full flex-shrink-0" />
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase leading-snug">
                RELATÓRIO DE MANUTENÇÃO PREVENTIVA E HIGIENIZAÇÃO
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {data.subtitle || 'Serviço Técnico de Sanitização e Aferição Operacional em Sistemas Split Hi-Wall'}
              </p>
            </div>
          </div>

          {/* CARD PRESTADORA & CLIENTE */}
          <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Prestadora */}
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-sky-800 uppercase tracking-wider">
                EMPRESA PRESTADORA
              </span>
              <p className="font-bold text-slate-900">Termoluc Refrigeração e Manutenção Ltda.</p>
              <p className="text-slate-600 text-[11px]">CNPJ: 04.385.033/0001-58 | Tel: (21) 97925-0568</p>
              <p className="text-slate-600 text-[11px]">Sede: Rua Pedro Ernesto, 91 – Gamboa, Rio de Janeiro/RJ</p>
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">DATA DE EXECUÇÃO</span>
                <span className="font-bold text-slate-900">{data.date_formatted}</span>
              </div>
            </div>

            {/* Cliente */}
            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="block text-[10px] font-black text-sky-800 uppercase tracking-wider">
                CLIENTE / LOCAL DA OBRA
              </span>
              <p className="font-bold text-slate-900">{displayClient}</p>
              <p className="text-slate-600 text-[11px] whitespace-pre-line">{data.client_address_full}</p>
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">STATUS GERAL DOS EQUIPAMENTOS</span>
                <span className="font-black text-emerald-600 uppercase tracking-wide">
                  {data.operational_status}
                </span>
              </div>
            </div>
          </div>

          {/* 4 CARDS DE INDICADORES (KPIS) */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* KPI 1 */}
            <div className="bg-white border border-slate-200 border-t-4 border-t-emerald-500 rounded-xl p-3 text-center shadow-xs">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {data.kpi_evaporators_clean}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                EVAPORADORAS LIMPAS
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white border border-slate-200 border-t-4 border-t-emerald-500 rounded-xl p-3 text-center shadow-xs">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {data.kpi_condensers_clean}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                CONDENSADORAS LIMPAS
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white border border-slate-200 border-t-4 border-t-sky-500 rounded-xl p-3 text-center shadow-xs">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {data.kpi_pressure}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                GÁS R410A (AFERIDO)
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white border border-slate-200 border-t-4 border-t-emerald-500 rounded-xl p-3 text-center shadow-xs">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {data.kpi_efficiency}
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                EFICIÊNCIA TÉRMICA
              </div>
            </div>
          </div>

          {/* 1. ESCOPO TÉCNICO E INSPEÇÃO INICIAL */}
          <div className="mt-6">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-1 mb-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                1. ESCOPO TÉCNICO E INSPEÇÃO INICIAL
              </h3>
              <div className="w-10 h-0.5 bg-sky-600 rounded-full" />
            </div>
            <p className="text-xs text-slate-700 leading-relaxed text-justify">
              {data.initial_scope}
            </p>
          </div>

          {/* 2. DETALHAMENTO DOS EQUIPAMENTOS ATENDIDOS */}
          <div className="mt-6">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-1 mb-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                2. DETALHAMENTO DOS EQUIPAMENTOS ATENDIDOS
              </h3>
              <div className="w-10 h-0.5 bg-sky-600 rounded-full" />
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1f3a] text-white text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3">AMBIENTE</th>
                    <th className="py-2 px-3">EQUIPAMENTO / MODELO</th>
                    <th className="py-2 px-3">SERVIÇO EXECUTADO</th>
                    <th className="py-2 px-3 text-center">PRESSÃO R410A</th>
                    <th className="py-2 px-3 text-center">CONDENSADORA</th>
                    <th className="py-2 px-3 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data.items.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-bold text-slate-900">{item.ambient}</td>
                      <td className="py-2 px-3 text-slate-700">{item.equipment_model}</td>
                      <td className="py-2 px-3 text-slate-600 text-[11px]">{item.service_executed}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold text-sky-800 bg-sky-50 border border-sky-200 rounded">
                          {item.pressure}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded">
                          {item.condenser_status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded">
                          {item.general_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ==================== PÁGINA 2 ==================== */}
        <div
          className="w-full bg-white text-slate-900 shadow-md border border-slate-200/80 rounded-xl p-8 sm:p-10 font-sans print:shadow-none print:border-none print:p-6 print:m-0"
          style={{ minHeight: '1050px' }}
        >
          {/* 3. PROCEDIMENTOS TÉCNICOS EXECUTADOS */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-1 mb-3">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                3. PROCEDIMENTOS TÉCNICOS EXECUTADOS
              </h3>
              <div className="w-10 h-0.5 bg-sky-600 rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.procedures.map((proc, index) => (
                <div
                  key={index}
                  className="border-l-4 border-sky-600 bg-white border border-slate-200 rounded-r-xl p-3.5 shadow-xs"
                >
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-[13px] mb-1">
                    {proc.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed text-justify">
                    {proc.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. PARECER TÉCNICO E CONCLUSÃO */}
          <div className="mt-6">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-1 mb-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                4. PARECER TÉCNICO E CONCLUSÃO
              </h3>
              <div className="w-10 h-0.5 bg-sky-600 rounded-full" />
            </div>

            <div className="border-l-4 border-sky-600 bg-sky-50/50 border border-sky-200 rounded-r-xl p-4">
              <h4 className="font-extrabold text-sky-800 text-xs uppercase tracking-wide mb-1">
                CONCLUSÃO DE DESEMPENHO E SEGURANÇA OPERACIONAL
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                {data.conclusion}
              </p>
            </div>
          </div>

          {/* 5. RECOMENDAÇÕES PREVENTIVAS E BOAS PRÁTICAS */}
          <div className="mt-6">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-1 mb-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                5. RECOMENDAÇÕES PREVENTIVAS E BOAS PRÁTICAS
              </h3>
              <div className="w-10 h-0.5 bg-sky-600 rounded-full" />
            </div>

            <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
              {data.preventive_recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-sky-600 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 6. ASSINATURA E RESPONSABILIDADE TÉCNICA */}
          <div className="mt-8">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-1 mb-3">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                6. ASSINATURA E RESPONSABILIDADE TÉCNICA
              </h3>
              <div className="w-10 h-0.5 bg-sky-600 rounded-full" />
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <p className="font-bold text-slate-900 text-xs">Termoluc Refrigeração e Manutenção Ltda.</p>
                <p className="text-slate-600 text-[11px]">CNPJ: 04.385.033/0001-58 | Tel: (21) 97925-0568</p>
                <p className="text-slate-600 text-[11px]">Rua Pedro Ernesto, 91 – Gamboa, Rio de Janeiro / RJ</p>
                <p className="text-sky-700 font-bold text-xs mt-2">
                  {data.city_date || 'Rio de Janeiro, 05 de Outubro de 2026.'}
                </p>
              </div>

              <div className="text-center pt-4 sm:pt-0">
                <div className="w-3/4 border-t border-slate-400 mx-auto mb-1.5" />
                <p className="font-black text-slate-900 text-[11px] uppercase tracking-wider">
                  TÉCNICO RESPONSÁVEL
                </p>
                <p className="text-slate-500 text-[11px]">Termoluc Refrigeração</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
