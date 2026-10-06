import React, { useState } from 'react';
import {
  Database,
  Users,
  ShieldCheck,
  Download,
  Upload,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { syncAllDataToSupabase } from '../services/db';
import { PRESET_ADMINS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { success, error, info } = useToast();
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSyncSupabase = async () => {
    try {
      setSyncing(true);
      info('Iniciando sincronização com as tabelas do Supabase...');
      const res = await syncAllDataToSupabase();
      if (res.success) {
        success(res.message);
      } else {
        error(res.message);
      }
    } catch (err: any) {
      error(err.message || 'Falha ao sincronizar com o Supabase.');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        clients: JSON.parse(localStorage.getItem('termoluc_clients_v4') || localStorage.getItem('termoluc_clients_v2') || '[]'),
        equipment: JSON.parse(localStorage.getItem('termoluc_equipment_v4') || localStorage.getItem('termoluc_equipment_v2') || '[]'),
        technicians: JSON.parse(localStorage.getItem('termoluc_technicians_v4') || localStorage.getItem('termoluc_technicians_v2') || '[]'),
        service_orders: JSON.parse(localStorage.getItem('termoluc_service_orders_v4') || localStorage.getItem('termoluc_service_orders_v2') || '[]'),
        order_images: JSON.parse(localStorage.getItem('termoluc_order_images_v4') || localStorage.getItem('termoluc_order_images_v2') || '[]'),
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `termoluc_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      success('Backup baixado com sucesso!');
    } catch {
      error('Falha ao exportar backup.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.clients) localStorage.setItem('termoluc_clients_v4', JSON.stringify(parsed.clients));
        if (parsed.equipment) localStorage.setItem('termoluc_equipment_v4', JSON.stringify(parsed.equipment));
        if (parsed.technicians) localStorage.setItem('termoluc_technicians_v4', JSON.stringify(parsed.technicians));
        if (parsed.service_orders) localStorage.setItem('termoluc_service_orders_v4', JSON.stringify(parsed.service_orders));
        if (parsed.order_images) localStorage.setItem('termoluc_order_images_v4', JSON.stringify(parsed.order_images));

        success('Backup importado localmente! Enviando para o Supabase...');
        await syncAllDataToSupabase();
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        error('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  const copySchemaNotice = () => {
    navigator.clipboard.writeText('supabase/schema.sql');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Configurações do Sistema
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Gerenciamento da base compartilhada, administradores e sincronização com o banco PostgreSQL / Supabase
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: 3 Administradores Compartilhados */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-termoluc-50 text-termoluc-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Administrador do Sistema</h2>
              <p className="text-xs text-slate-500">Acesso Administrativo Centralizado</p>
            </div>
          </div>

          <div className="p-4 bg-termoluc-50/60 rounded-2xl border border-termoluc-200/70 text-xs text-termoluc-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-termoluc-800">
              <ShieldCheck className="w-4 h-4 text-termoluc-600" />
              Conta de Administrador Ativa
            </div>
            <p className="leading-relaxed">
              O sistema está configurado com acesso administrativo direto para a Termoluc Refrigeração.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Conta de Administrador Oficial:
            </span>
            {PRESET_ADMINS.map((adm) => (
              <div
                key={adm.id}
                className="p-3 rounded-xl border border-termoluc-500 bg-termoluc-50/70 text-termoluc-900 font-semibold flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-termoluc-700 text-white font-bold text-[10px] flex items-center justify-center">
                    ADM
                  </div>
                  <div>
                    <span className="font-bold block">{adm.name}</span>
                    <span className="text-[11px] text-slate-500">{adm.email}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-termoluc-600 text-white text-[10px] font-bold">
                  Sessão Ativa
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Conexão com o Banco de Dados */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Banco de Dados PostgreSQL / Supabase</h2>
              <p className="text-xs text-slate-500">Status da conexão e sincronização em nuvem</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-slate-50 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              {isSupabaseConfigured ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-800">Conectado ao Supabase (njdkldfvyjxkybumhzah)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-slate-800">Persistência Local Ativa</span>
                </>
              )}
            </div>
            <p className="text-slate-600 leading-relaxed">
              Todos os novos clientes, equipamentos e ordens de serviço salvos são gravados nas tabelas do Supabase.
            </p>
          </div>

          {/* Botão de Forçar Sincronização */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSyncSupabase}
              disabled={syncing}
              className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-termoluc-600 hover:bg-termoluc-700 text-white font-bold text-sm shadow-md shadow-termoluc-600/30 transition-all active:scale-98 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando com Supabase...' : 'Sincronizar Cadastros com o Banco Supabase'}
            </button>
            <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-slate-600 leading-relaxed">
              💡 <strong>Instrução:</strong> Se você realizou cadastros ou edições neste computador, clique no botão acima para enviar tudo automaticamente para a nuvem. Todos os demais computadores passarão a enxergar esses dados instantaneamente.
            </div>
          </div>

          <div className="pt-2 space-y-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Script SQL de Criação das Tabelas & RLS:
            </span>
            <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs flex items-center justify-between">
              <span>supabase/schema.sql</span>
              <button
                onClick={copySchemaNotice}
                className="text-xs text-termoluc-400 hover:text-termoluc-300 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar Caminho'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              O arquivo <code className="font-mono text-slate-700">supabase/schema.sql</code> contém toda a estrutura de tabelas, sequências numéricas de OS, storage e políticas de segurança compartilhada.
            </p>
          </div>
        </div>

        {/* Card 3: Backup & Exportação */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Backup & Importação dos Dados</h2>
              <p className="text-xs text-slate-500">Exporte ou restaure todos os clientes, equipamentos e ordens de serviço em formato JSON</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Exportar Cópia de Segurança</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Baixe um arquivo contendo todos os cadastros e histórico para arquivamento local seguro.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                Baixar Arquivo de Backup
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Restaurar / Importar Dados</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Suba um arquivo de backup previamente gerado para restaurar a base de dados.
                </p>
              </div>
              <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-termoluc-500 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs">
                <Upload className="w-4 h-4 text-termoluc-600" />
                Selecionar Arquivo JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
