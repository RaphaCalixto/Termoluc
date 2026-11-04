import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Filter, 
  Sparkles, 
  Wrench, 
  Snowflake, 
  ClipboardCheck, 
  Download, 
  Eye, 
  Trash2, 
  Calendar, 
  User,
  Building2 
} from 'lucide-react';
import { Report, ReportCategory, Client } from '../types';
import { getReports, getClients, deleteReport, subscribeToDataChanges } from '../services/db';
import { ReportUploadModal } from '../components/reports/ReportUploadModal';
import { ReportViewerModal } from '../components/reports/ReportViewerModal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';

interface CategoryCardInfo {
  id: ReportCategory;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgLight: string;
  borderColor: string;
  hoverBorder: string;
  badgeBg: string;
}

const CATEGORY_CARDS: CategoryCardInfo[] = [
  {
    id: 'Limpeza',
    title: 'Limpeza',
    subtitle: 'Higienização, descontaminação e limpeza de serpentinas',
    icon: Sparkles,
    color: 'text-sky-600',
    bgLight: 'bg-sky-50/70',
    borderColor: 'border-sky-200',
    hoverBorder: 'hover:border-sky-400',
    badgeBg: 'bg-sky-100 text-sky-800',
  },
  {
    id: 'Manutenção',
    title: 'Manutenção',
    subtitle: 'Manutenções preventivas, corretivas e troca de peças',
    icon: Wrench,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50/70',
    borderColor: 'border-amber-200',
    hoverBorder: 'hover:border-amber-400',
    badgeBg: 'bg-amber-100 text-amber-800',
  },
  {
    id: 'Instalação',
    title: 'Instalação',
    subtitle: 'Instalações novas, testes de estanqueidade e start-up',
    icon: Snowflake,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50/70',
    borderColor: 'border-blue-200',
    hoverBorder: 'hover:border-blue-400',
    badgeBg: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'Laudo',
    title: 'Laudo',
    subtitle: 'Laudos técnicos periciais, planos PMOC e vistorias',
    icon: ClipboardCheck,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50/70',
    borderColor: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-800',
  },
];

export const ReportsPage: React.FC = () => {
  const { success, error } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'Todos'>('Todos');
  const [clientFilter, setClientFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modais
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadDefaultCategory, setUploadDefaultCategory] = useState<ReportCategory>('Manutenção');
  const [viewerReport, setViewerReport] = useState<Report | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rData, cData] = await Promise.all([
        getReports(),
        getClients(),
      ]);
      setReports(rData);
      setClients(cData);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataChanges((entity) => {
      if (entity === 'reports' || entity === 'all') {
        loadData();
      }
    });
    return () => unsubscribe();
  }, []);

  // Contagem por categoria
  const countsByCategory = {
    Limpeza: reports.filter(r => r.category === 'Limpeza').length,
    Manutenção: reports.filter(r => r.category === 'Manutenção').length,
    Instalação: reports.filter(r => r.category === 'Instalação').length,
    Laudo: reports.filter(r => r.category === 'Laudo').length,
  };

  // Filtragem
  const filteredReports = reports.filter(rep => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      rep.title.toLowerCase().includes(q) ||
      (rep.client_name && rep.client_name.toLowerCase().includes(q)) ||
      (rep.technician_name && rep.technician_name.toLowerCase().includes(q)) ||
      (rep.equipment_name && rep.equipment_name.toLowerCase().includes(q)) ||
      (rep.service_order_number && rep.service_order_number.toLowerCase().includes(q)) ||
      (rep.notes && rep.notes.toLowerCase().includes(q));

    const matchesCategory = selectedCategory === 'Todos' || rep.category === selectedCategory;
    const matchesClient = !clientFilter || rep.client_id === clientFilter;
    const matchesDate = !dateFilter || rep.report_date.startsWith(dateFilter);

    return matchesSearch && matchesCategory && matchesClient && matchesDate;
  });

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;
    try {
      setDeleting(true);
      await deleteReport(reportToDelete.id);
      success(`Relatório "${reportToDelete.title}" excluído.`);
      setDeleteModalOpen(false);
      setReportToDelete(null);
      await loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao excluir relatório.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (rep: Report) => {
    const link = document.createElement('a');
    link.href = rep.file_url;
    link.download = rep.file_name || `${rep.title}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCardClick = (catId: ReportCategory) => {
    if (selectedCategory === catId) {
      setSelectedCategory('Todos');
    } else {
      setSelectedCategory(catId);
    }
  };

  const handleOpenUploadForCategory = (catId: ReportCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadDefaultCategory(catId);
    setUploadModalOpen(true);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todos');
    setClientFilter('');
    setDateFilter('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Relatórios Técnicos (PDF)
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-termoluc-100 text-termoluc-800 border border-termoluc-200">
              Banco de Dados Supabase
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Armazenamento e gestão de laudos e relatórios em PDF divididos por categoria técnica
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setUploadDefaultCategory('Manutenção');
            setUploadModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-termoluc-600 hover:bg-termoluc-700 text-white text-xs font-bold shadow-sm shadow-termoluc-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Enviar Relatório (PDF)</span>
        </button>
      </div>

      {/* 4 Cards de Categorias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORY_CARDS.map(cat => {
          const Icon = cat.icon;
          const count = countsByCategory[cat.id];
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => handleCardClick(cat.id)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between group ${
                isSelected
                  ? `${cat.borderColor} ${cat.bgLight} shadow-md ring-2 ring-termoluc-400/40`
                  : `border-slate-200/90 bg-white hover:bg-slate-50/70 ${cat.hoverBorder} shadow-xs`
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    isSelected ? 'bg-white shadow-xs' : 'bg-slate-100 group-hover:bg-white'
                  } ${cat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cat.badgeBg}`}>
                    {count} {count === 1 ? 'PDF' : 'PDFs'}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2">
                  {cat.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 group-hover:text-termoluc-600 transition-colors">
                  {isSelected ? '✓ Filtrando' : 'Ver relatórios'}
                </span>

                <button
                  type="button"
                  onClick={(e) => handleOpenUploadForCategory(cat.id, e)}
                  className="p-1 text-slate-400 hover:text-termoluc-600 hover:bg-white rounded-lg transition-colors"
                  title={`Adicionar novo relatório em ${cat.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 ml-1" />
          <input
            type="text"
            placeholder="Pesquisar por título, cliente, técnico, equipamento ou número de OS..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Linha de Filtros */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filtrar:
          </div>

          {/* Abas de Categoria */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedCategory('Todos')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === 'Todos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({reports.length})
            </button>
            {CATEGORY_CARDS.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.title} ({countsByCategory[cat.id]})
              </button>
            ))}
          </div>

          {/* Cliente */}
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-termoluc-500 cursor-pointer max-w-xs truncate"
          >
            <option value="">Todos os Clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Mês / Data */}
          <input
            type="month"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-termoluc-500 cursor-pointer"
            title="Filtrar por Mês"
          />

          {(selectedCategory !== 'Todos' || clientFilter || dateFilter || searchQuery) && (
            <button
              onClick={resetFilters}
              className="text-xs text-termoluc-600 hover:underline font-semibold ml-auto"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de Relatórios */}
      {loading ? (
        <LoadingSpinner message="Carregando relatórios técnicos..." />
      ) : filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map(rep => {
            const catInfo = CATEGORY_CARDS.find(c => c.id === rep.category) || CATEGORY_CARDS[0];
            const Icon = catInfo.icon;

            return (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-termoluc-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Category Badge & Date */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${catInfo.badgeBg}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {rep.category}
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(rep.report_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Title & PDF Badge */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-termoluc-50 text-termoluc-600 border border-termoluc-100 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      PDF
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-termoluc-700 transition-colors line-clamp-2">
                        {rep.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {rep.file_name}
                      </p>
                    </div>
                  </div>

                  {/* Meta Details: Cliente, Técnico, Equipamento */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 mb-3">
                    {rep.client_name && (
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">Cliente: <strong className="text-slate-800">{rep.client_name}</strong></span>
                      </div>
                    )}
                    {rep.equipment_name && (
                      <div className="flex items-center gap-2 truncate">
                        <Wrench className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">Equipamento: <strong className="text-slate-800">{rep.equipment_name}</strong></span>
                      </div>
                    )}
                    {rep.service_order_number && (
                      <div className="flex items-center gap-2 truncate text-termoluc-700 font-semibold">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Ordem de Serviço: {rep.service_order_number}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">Técnico: <strong className="text-slate-800">{rep.technician_name || 'Alessandro Araújo'}</strong></span>
                    </div>
                  </div>

                  {/* Notes snippet se houver */}
                  {rep.notes && (
                    <p className="text-xs text-slate-500 line-clamp-2 italic mb-3">
                      "{rep.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400">
                    {rep.file_size ? `${(rep.file_size / 1024 / 1024).toFixed(2)} MB` : 'PDF'}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewerReport(rep)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-termoluc-50 hover:bg-termoluc-100 text-termoluc-700 text-xs font-bold transition-colors"
                      title="Visualizar PDF"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(rep)}
                      className="p-1.5 text-slate-500 hover:text-termoluc-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Baixar arquivo PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReportToDelete(rep);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir relatório"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title={
            selectedCategory === 'Todos'
              ? 'Nenhum relatório encontrado'
              : `Nenhum relatório em "${selectedCategory}"`
          }
          description="Envie um arquivo PDF para arquivar relatórios de limpeza, manutenção, instalação ou laudos técnicos no banco de dados."
          actionText="+ Armazenar Relatório (PDF)"
          onAction={() => {
            setUploadDefaultCategory(selectedCategory === 'Todos' ? 'Manutenção' : selectedCategory);
            setUploadModalOpen(true);
          }}
        />
      )}

      {/* Modais */}
      <ReportUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        defaultCategory={uploadDefaultCategory}
        onSuccess={() => {
          loadData();
        }}
      />

      <ReportViewerModal
        isOpen={Boolean(viewerReport)}
        onClose={() => setViewerReport(null)}
        report={viewerReport}
        onDelete={(rep) => {
          setViewerReport(null);
          setReportToDelete(rep);
          setDeleteModalOpen(true);
        }}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setReportToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Excluir Relatório Técnico"
        message={`Deseja realmente excluir o relatório "${reportToDelete?.title}"? Esta ação não pode ser desfeita.`}
        loading={deleting}
      />
    </div>
  );
};
