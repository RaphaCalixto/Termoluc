import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  MapPin,
  Wrench,
  DollarSign,
  Edit2,
  Trash2,
  MessageCircle
} from 'lucide-react';
import { Schedule, ScheduleStatus } from '../types';
import {
  getSchedules,
  deleteSchedule,
  updateSchedule,
  subscribeToDataChanges
} from '../services/db';
import { ScheduleFormModal } from '../components/schedule/ScheduleFormModal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../context/ToastContext';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const STATUS_COLORS: Record<ScheduleStatus, { bg: string; text: string; border: string; dot: string }> = {
  'Agendado': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  'Confirmado': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
  'Em andamento': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  'Concluído': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Cancelado': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

export const SchedulePage: React.FC = () => {
  const { success, error } = useToast();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected date state (defaults to today)
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Calendar month/year navigation state
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Schedule | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSchedules();
      setSchedules(data);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataChanges(() => {
      loadData();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Days from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const prevMonthDays: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      prevMonthDays.push({ dateStr, dayNumber: day, isCurrentMonth: false });
    }

    // Days in current month
    const currentMonthDays: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      currentMonthDays.push({ dateStr, dayNumber: day, isCurrentMonth: true });
    }

    // Days from next month to fill complete grid rows (multiple of 7)
    const totalRendered = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = totalRendered % 7 === 0 ? 0 : 7 - (totalRendered % 7);
    const nextMonthDays: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];
    for (let day = 1; day <= remainingDays; day++) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      nextMonthDays.push({ dateStr, dayNumber: day, isCurrentMonth: false });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentYear, currentMonth]);

  // Group schedules by date for easy calendar dots
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    schedules.forEach(s => {
      const list = map.get(s.service_date) || [];
      list.push(s);
      map.set(s.service_date, list);
    });
    return map;
  }, [schedules]);

  // Schedules for selected date
  const selectedDateSchedules = useMemo(() => {
    return (schedulesByDate.get(selectedDate) || []).sort((a, b) =>
      (a.service_time || '').localeCompare(b.service_time || '')
    );
  }, [schedulesByDate, selectedDate]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await deleteSchedule(itemToDelete.id);
      success('Agendamento excluído com sucesso.');
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao excluir agendamento.');
    } finally {
      setDeleting(false);
    }
  };

  // Status toggle quick action
  const handleQuickStatusChange = async (schedule: Schedule, newStatus: ScheduleStatus) => {
    try {
      await updateSchedule(schedule.id, { status: newStatus });
      success(`Status alterado para "${newStatus}".`);
      await loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao atualizar status.');
    }
  };

  // WhatsApp shortcut
  const handleSendWhatsApp = (item: Schedule) => {
    const phone = item.client_phone || item.client?.phone;
    if (!phone) {
      error('Este cliente não possui telefone cadastrado.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const [y, m, d] = item.service_date.split('-');
    const formattedDate = `${d}/${m}/${y}`;

    const message = encodeURIComponent(
      `Olá, ${item.client_name}! Aqui é da Termoluc Refrigeração. Confirmamos seu agendamento de *${item.service_type}* marcado para o dia *${formattedDate}* às *${item.service_time}*.\n\nEndereço: ${item.address || 'Conforme combinado'}.\n\nQualquer dúvida ou caso precise reagendar, estamos à disposição!`
    );

    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
  };

  // Formatted date string for selected date header
  const formattedSelectedDate = useMemo(() => {
    if (selectedDate === todayStr) {
      return 'Hoje';
    }
    const [, m, d] = selectedDate.split('-');
    const monthName = MONTH_NAMES[parseInt(m, 10) - 1];
    return `${parseInt(d, 10)} de ${monthName}`;
  }, [selectedDate, todayStr]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Agenda de Serviços
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gerencie os horários, atendimentos e lembretes aos clientes via WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Botão Novo Agendamento */}
          <button
            type="button"
            onClick={() => {
              setEditingSchedule(null);
              setFormModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-termoluc-600 hover:bg-termoluc-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-termoluc-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Agendar Novo Serviço
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar (Left) + Selected Day Services (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CALENDÁRIO MENSAL (Lado Esquerdo - 7 ou 8 colunas) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleGoToToday}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-termoluc-700 hover:bg-slate-100 transition-all border border-slate-200"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-200"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-200"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Header Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
            {WEEK_DAYS.map((wd) => (
              <div
                key={wd}
                className="py-1 text-[11px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((cell) => {
              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === todayStr;
              const daySchedules = schedulesByDate.get(cell.dateStr) || [];
              const hasEvents = daySchedules.length > 0;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`relative min-h-[58px] sm:min-h-[82px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-termoluc-500 bg-termoluc-50/50 shadow-xs ring-2 ring-termoluc-500/20'
                      : cell.isCurrentMonth
                      ? 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      : 'border-slate-50 bg-slate-50/30 opacity-40 hover:opacity-75'
                  }`}
                >
                  {/* Top Day Number Row */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-bold rounded-lg ${
                        isSelected
                          ? 'w-6 h-6 bg-termoluc-600 text-white shadow-xs'
                          : isToday
                          ? 'w-6 h-6 bg-slate-900 text-white'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Badge de quantidade para telas médias/grandes */}
                    {hasEvents && (
                      <span className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-termoluc-100 text-termoluc-800">
                        {daySchedules.length}
                      </span>
                    )}
                  </div>

                  {/* Event indicators / list preview */}
                  <div className="mt-1 space-y-0.5 overflow-hidden">
                    {/* Visual Dots on Mobile */}
                    <div className="flex sm:hidden gap-1 justify-center mt-1">
                      {daySchedules.slice(0, 3).map((s, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${
                            STATUS_COLORS[s.status]?.dot || 'bg-termoluc-500'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Micro pills on desktop */}
                    <div className="hidden sm:block space-y-1">
                      {daySchedules.slice(0, 2).map((s) => (
                        <div
                          key={s.id}
                          className={`text-[10px] font-semibold truncate px-1.5 py-0.5 rounded-md border ${
                            STATUS_COLORS[s.status]?.bg || 'bg-slate-50'
                          } ${STATUS_COLORS[s.status]?.text || 'text-slate-700'} ${
                            STATUS_COLORS[s.status]?.border || 'border-slate-200'
                          }`}
                          title={`${s.service_time} • ${s.client_name} - ${s.service_type}`}
                        >
                          <span className="font-bold">{s.service_time}</span> {s.client_name}
                        </div>
                      ))}
                      {daySchedules.length > 2 && (
                        <div className="text-[9px] font-bold text-slate-400 pl-1">
                          +{daySchedules.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ATENDIMENTOS DO DIA (Lado Direito - 4 ou 5 colunas) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col min-h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                ATENDIMENTOS DO DIA
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                {formattedSelectedDate}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingSchedule(null);
                setFormModalOpen(true);
              }}
              className="p-2 rounded-xl bg-termoluc-50 hover:bg-termoluc-100 text-termoluc-700 border border-termoluc-200 transition-all shadow-2xs"
              title="Adicionar serviço para esta data"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* List or Empty State */}
          <div className="flex-1 py-4 flex flex-col justify-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                <LoadingSpinner />
                <span className="text-xs">Carregando agendamentos...</span>
              </div>
            ) : selectedDateSchedules.length === 0 ? (
              /* Empty State matching image style */
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <CalendarIcon className="w-7 h-7 stroke-[1.5]" />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Nenhum serviço agendado para esta data.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSchedule(null);
                    setFormModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-termoluc-50 hover:bg-termoluc-100 text-termoluc-700 text-xs font-bold border border-termoluc-200 transition-all shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agendar agora
                </button>
              </div>
            ) : (
              /* Schedule items list */
              <div className="space-y-3 w-full">
                {selectedDateSchedules.map((item) => {
                  const statusConfig = STATUS_COLORS[item.status] || STATUS_COLORS['Agendado'];

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-3"
                    >
                      {/* Top Time and Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                          <Clock className="w-3.5 h-3.5 text-termoluc-600" />
                          <span>{item.service_time}</span>
                        </div>

                        <select
                          value={item.status}
                          onChange={(e) => handleQuickStatusChange(item, e.target.value as ScheduleStatus)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} cursor-pointer focus:outline-none focus:ring-1 focus:ring-termoluc-500`}
                          title="Alterar status do serviço"
                        >
                          <option value="Agendado">Agendado</option>
                          <option value="Confirmado">Confirmado</option>
                          <option value="Em andamento">Em andamento</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </div>

                      {/* Client & Service Info */}
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                          {item.client_name}
                        </h3>
                        <p className="text-xs font-semibold text-termoluc-700 mt-0.5">
                          {item.service_type}
                        </p>
                      </div>

                      {/* Details: Equipment, Tech, Address */}
                      <div className="space-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        {item.equipment_name && (
                          <div className="flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{item.equipment_name}</span>
                          </div>
                        )}
                        {item.technician_name && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>Técnico: {item.technician_name}</span>
                          </div>
                        )}
                        {item.address && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{item.address}</span>
                          </div>
                        )}
                        {item.value && (
                          <div className="flex items-center gap-1.5 font-bold text-slate-700">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        {/* WhatsApp reminder shortcut */}
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(item)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all"
                          title="Enviar lembrete via WhatsApp para o cliente"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSchedule(item);
                              setFormModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-termoluc-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="Editar agendamento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setItemToDelete(item);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Excluir agendamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Agendamento */}
      <ScheduleFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingSchedule(null);
        }}
        schedule={editingSchedule}
        defaultDate={selectedDate}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Agendamento"
        message={`Deseja realmente excluir o agendamento de "${itemToDelete?.client_name}" (${itemToDelete?.service_type})?`}
        loading={deleting}
      />

    </div>
  );
};
